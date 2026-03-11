#!/usr/bin/env python3
"""
Docker Environment Management Script for dockerhub-mimic
Manages Docker Compose services: app (.NET), db (PostgreSQL), mem-cache (Redis), reverse-proxy (Nginx)
"""

import subprocess
import sys
import argparse
import shutil
from pathlib import Path


class DockerEnvManager:
    """Manages Docker Compose environment for the application."""

    SUPPORTED_SERVICES = {"app", "db", "mem-cache", "frontend", "reverse-proxy"}
    SUPPORTED_TEST_TARGETS = {"backend", "frontend"}
    
    def __init__(self):
        self.compose_file = Path(__file__).parent / "docker-compose.yml"
        if not self.compose_file.exists():
            print(f"Error: docker-compose.yml not found at {self.compose_file}")
            sys.exit(1)
    
    def _run_command(self, command, check=True, cwd=None):
        """Execute a shell command."""
        try:
            result = subprocess.run(
                command,
                shell=True,
                check=check,
                capture_output=False,
                text=True,
                cwd=cwd
            )
            return result.returncode == 0
        except subprocess.CalledProcessError as e:
            print(f"Error executing command: {e}")
            return False

    def _is_supported_service(self, service):
        return service in self.SUPPORTED_SERVICES

    def _resolve_test_targets(self, targets):
        if not targets:
            return ["backend", "frontend"]

        invalid = [target for target in targets if target not in self.SUPPORTED_TEST_TARGETS]
        if invalid:
            print(f"Error: unknown test target(s): {', '.join(invalid)}. Supported: backend, frontend")
            return None

        ordered_targets = []
        for target in ["backend", "frontend"]:
            if target in targets:
                ordered_targets.append(target)
        return ordered_targets
    
    def build(self, service=None):
        """Build Docker images."""
        print("🔨 Building Docker images...")
        if service and not self._is_supported_service(service):
            print(f"Error: unknown service '{service}'. Supported: {', '.join(sorted(self.SUPPORTED_SERVICES))}")
            return False
        cmd = "docker-compose build"
        if service:
            cmd += f" {service}"
        return self._run_command(cmd)
    
    def start(self, detached=True, build=False):
        """Start all services."""
        print("Starting services...")

        print("Restarting database service (db)...")
        if not self._run_command("docker-compose up -d db"):
            return False
        if not self._run_command("docker-compose restart db"):
            return False

        cmd = "docker-compose up"
        if detached:
            cmd += " -d"
        if build:
            cmd += " --build"
        return self._run_command(cmd)
    
    def stop(self):
        """Stop all services."""
        print("Stopping services...")
        return self._run_command("docker-compose stop")
    
    def down(self, volumes=False):
        """Stop and remove containers."""
        print("Stopping and removing containers...")
        cmd = "docker-compose down"
        if volumes:
            cmd += " -v"
            print("Removing volumes (database data will be deleted)...")
        return self._run_command(cmd)
    
    def restart(self, service=None):
        """Restart services."""
        print("Restarting services...")
        if service and not self._is_supported_service(service):
            print(f"Error: unknown service '{service}'. Supported: {', '.join(sorted(self.SUPPORTED_SERVICES))}")
            return False
        cmd = "docker-compose restart"
        if service:
            cmd += f" {service}"
        return self._run_command(cmd)
    
    def logs(self, service=None, follow=False):
        """View service logs."""
        if service and not self._is_supported_service(service):
            print(f"Error: unknown service '{service}'. Supported: {', '.join(sorted(self.SUPPORTED_SERVICES))}")
            return False
        cmd = "docker-compose logs"
        if follow:
            cmd += " -f"
        if service:
            cmd += f" {service}"
        return self._run_command(cmd, check=False)
    
    def status(self):
        """Show status of services."""
        print("Service status:")
        return self._run_command("docker-compose ps")
    
    def clean(self):
        """Clean up all containers, images, and volumes."""
        print("Cleaning up Docker environment...")
        
        # Stop and remove containers
        self.down(volumes=True)
        
        # Remove images
        print("Removing Docker images...")
        images = [
            "dockerhub-mimic-app",
            "dockerhub-mimic-frontend"
        ]
        for img in images:
            subprocess.run(
                f"docker rmi {img}",
                shell=True,
                capture_output=True
            )
        
        print("Cleanup complete!")
        return True
    
    def _test_backend(self, coverage=False):
        """Run backend tests inside the build container."""
        print("Building test container...")
        backend_dir = Path(__file__).parent / "backend"

        build_cmd = f'docker build --target test -t dockerhub-mimic-test "{backend_dir}"'
        if not self._run_command(build_cmd):
            return False

        print("Running tests in container...")
        if coverage:
            coverage_dir = backend_dir / "coverage"
            coverage_dir.mkdir(exist_ok=True)
            run_cmd = (
                f'docker run --rm '
                f'--entrypoint dotnet '
                f'-v "{coverage_dir}:/src/coverage" '
                f'dockerhub-mimic-test '
                f'test backend.slnx '
                f'--no-build -c Release '
                f'--collect:"XPlat Code Coverage" '
                f'--settings /src/Tests/coverage.runsettings '
                f'--results-directory /src/coverage '
                f'--logger "console;verbosity=normal"'
            )
        else:
            run_cmd = 'docker run --rm dockerhub-mimic-test'

        return self._run_command(run_cmd)

    def _test_frontend(self, coverage=False):
        frontend_dir = Path(__file__).parent / "frontend"
        print("Running frontend tests...")
        npm = 'npm.cmd' if sys.platform == 'win32' else 'npm'
        cmd = f'{npm} run test:coverage' if coverage else f'{npm} run test'
        return self._run_command(cmd, cwd=frontend_dir)

    def test(self, targets=None, coverage=False):
        resolved_targets = self._resolve_test_targets(targets)
        if resolved_targets is None:
            return False

        print(f"Test targets: {', '.join(resolved_targets)}")

        for target in resolved_targets:
            if target == "backend" and not self._test_backend(coverage=coverage):
                return False
            if target == "frontend" and not self._test_frontend(coverage=coverage):
                return False

        if coverage and "backend" in resolved_targets:  # ← samo za backend
            return self.coverage_report()

        return True

    def coverage_report(self, threshold=80):
        """Generate HTML coverage report from collected Cobertura files."""
        backend_dir = Path(__file__).parent / "backend"

        cobertura_files = list(backend_dir.rglob("coverage.cobertura.xml"))
        if not cobertura_files:
            print("No coverage files found. Run 'python run_env.py test --coverage' first.")
            return False

        normalized_dir = backend_dir / "coverage" / "normalized"
        normalized_dir.mkdir(parents=True, exist_ok=True)

        backend_path = backend_dir.as_posix()
        normalized_files = []
        for index, source_file in enumerate(cobertura_files, start=1):
            xml = source_file.read_text(encoding="utf-8")
            xml = xml.replace("\\src\\", f"{backend_path}/")
            xml = xml.replace("/src/", f"{backend_path}/")
            normalized_file = normalized_dir / f"coverage.{index}.cobertura.xml"
            normalized_file.write_text(xml, encoding="utf-8")
            normalized_files.append(str(normalized_file))

        reports_arg = ";".join(normalized_files)
        target_dir = backend_dir / "coverage" / "report"
        target_dir.mkdir(parents=True, exist_ok=True)

        if shutil.which("reportgenerator") is None:
            print("Installing ReportGenerator tool...")
            if not self._run_command("dotnet tool update -g dotnet-reportgenerator-globaltool"):
                if not self._run_command("dotnet tool install -g dotnet-reportgenerator-globaltool"):
                    return False

        print("Generating coverage report...")
        cmd = (
            f'reportgenerator '
            f'-reports:"{reports_arg}" '
            f'-targetdir:"{target_dir}" '
            f'-sourcedirs:"{backend_dir}" '
            f'"-reporttypes:Html;TextSummary"'
        )

        if not self._run_command(cmd):
            return False

        # Read and print summary
        summary_file = target_dir / "Summary.txt"
        if not summary_file.exists():
            print("Summary.txt not found, skipping threshold check.")
            return True

        summary = summary_file.read_text(encoding="utf-8")
        print("\nCoverage Summary:")
        print(summary)

        # Extract line coverage percentage
        import re
        match = re.search(r'Line coverage:\s*([\d.]+)', summary)
        if not match:
            print("Could not parse line coverage from summary, skipping threshold check.")
            return True

        coverage = float(match.group(1))
        print(f"\nLine coverage: {coverage:.1f}%")

        if coverage < threshold:
            print(f"Coverage {coverage:.1f}% is below threshold of {threshold}%!")
            return False

        print(f"Coverage {coverage:.1f}% passed threshold of {threshold}%!")
        print(f"Report: {target_dir / 'index.html'}")
        return True

    def exec_service(self, service, command):
        """Execute a command in a running service."""
        if not self._is_supported_service(service):
            print(f"Error: unknown service '{service}'. Supported: {', '.join(sorted(self.SUPPORTED_SERVICES))}")
            return False
        print(f"🔧 Executing command in {service}...")
        cmd = f"docker-compose exec {service} {command}"
        return self._run_command(cmd, check=False)


def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="Manage Docker environment for dockerhub-mimic",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python run_env.py start              # Start all services
    python run_env.py start --build      # Build and start
    python run_env.py stop               # Stop all services
    python run_env.py restart app        # Restart app service
    python run_env.py restart db         # Restart db service
    python run_env.py logs -f            # Follow logs
    python run_env.py logs reverse-proxy # View reverse-proxy logs
    python run_env.py logs mem-cache     # View Redis logs
    python run_env.py status             # Show service status
    python run_env.py clean              # Clean up everything
    python run_env.py test               # Run backend + frontend tests
    python run_env.py test backend       # Run backend tests only
    python run_env.py test frontend      # Run frontend tests only
    python run_env.py test --coverage    # Run all tests with coverage
    python run_env.py coverage-report    # Generate HTML coverage report
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Build command
    build_parser = subparsers.add_parser("build", help="Build Docker images")
    build_parser.add_argument("service", nargs="?", help="Specific service to build")
    
    # Start command
    start_parser = subparsers.add_parser("start", help="Start services")
    start_parser.add_argument("--build", action="store_true", help="Build images before starting")
    start_parser.add_argument("--foreground", action="store_true", help="Run in foreground")
    
    # Stop command
    subparsers.add_parser("stop", help="Stop services")
    
    # Down command
    down_parser = subparsers.add_parser("down", help="Stop and remove containers")
    down_parser.add_argument("--volumes", action="store_true", help="Remove volumes too")
    
    # Restart command
    restart_parser = subparsers.add_parser("restart", help="Restart services")
    restart_parser.add_argument("service", nargs="?", help="Specific service to restart")
    
    # Logs command
    logs_parser = subparsers.add_parser("logs", help="View service logs")
    logs_parser.add_argument("service", nargs="?", help="Specific service logs")
    logs_parser.add_argument("-f", "--follow", action="store_true", help="Follow log output")
    
    # Status command
    subparsers.add_parser("status", help="Show service status")
    
    # Clean command
    subparsers.add_parser("clean", help="Clean up everything (containers, images, volumes)")

    # Test command
    test_parser = subparsers.add_parser("test", help="Run tests")
    test_parser.add_argument("targets", nargs="*", help="Optional test targets: backend frontend")
    test_parser.add_argument("--coverage", action="store_true", help="Collect code coverage")

    # Coverage report command
    subparsers.add_parser("coverage-report", help="Generate coverage HTML report")

    # Exec command
    exec_parser = subparsers.add_parser("exec", help="Execute command in service")
    exec_parser.add_argument("service", help="Service name")
    exec_parser.add_argument("cmd", nargs="+", help="Command to execute")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(0)
    
    manager = DockerEnvManager()
    
    # Execute command
    success = False
    if args.command == "build":
        success = manager.build(args.service)
    elif args.command == "start":
        success = manager.start(detached=not args.foreground, build=args.build)
        if success:
            print("\n sServices started successfully!")
            print("   Reverse Proxy: http://localhost:3000")
            print("   App (internal): http://app:8080")
            print("   Database: localhost:5432")
            print("   Redis (internal): mem-cache:6379")
    elif args.command == "stop":
        success = manager.stop()
    elif args.command == "down":
        success = manager.down(volumes=args.volumes)
    elif args.command == "restart":
        success = manager.restart(args.service)
    elif args.command == "logs":
        success = manager.logs(args.service, follow=args.follow)
    elif args.command == "status":
        success = manager.status()
    elif args.command == "clean":
        success = manager.clean()
    elif args.command == "test":
        success = manager.test(targets=args.targets, coverage=args.coverage)
    elif args.command == "coverage-report":
        success = manager.coverage_report()
    elif args.command == "exec":
        success = manager.exec_service(args.service, " ".join(args.cmd))
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
