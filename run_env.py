#!/usr/bin/env python3
"""
Docker Environment Management Script for dockerhub-mimic
Manages Docker Compose services: frontend (React), backend (.NET), database (PostgreSQL)
"""

import subprocess
import sys
import argparse
from pathlib import Path


class DockerEnvManager:
    """Manages Docker Compose environment for the application."""
    
    def __init__(self):
        self.compose_file = Path(__file__).parent / "docker-compose.yml"
        if not self.compose_file.exists():
            print(f"Error: docker-compose.yml not found at {self.compose_file}")
            sys.exit(1)
    
    def _run_command(self, command, check=True):
        """Execute a shell command."""
        try:
            result = subprocess.run(
                command,
                shell=True,
                check=check,
                capture_output=False,
                text=True
            )
            return result.returncode == 0
        except subprocess.CalledProcessError as e:
            print(f"Error executing command: {e}")
            return False
    
    def build(self, service=None):
        """Build Docker images."""
        print("🔨 Building Docker images...")
        cmd = "docker-compose build"
        if service:
            cmd += f" {service}"
        return self._run_command(cmd)
    
    def start(self, detached=True, build=False):
        """Start all services."""
        print("🚀 Starting services...")
        cmd = "docker-compose up"
        if detached:
            cmd += " -d"
        if build:
            cmd += " --build"
        return self._run_command(cmd)
    
    def stop(self):
        """Stop all services."""
        print("🛑 Stopping services...")
        return self._run_command("docker-compose stop")
    
    def down(self, volumes=False):
        """Stop and remove containers."""
        print("🔻 Stopping and removing containers...")
        cmd = "docker-compose down"
        if volumes:
            cmd += " -v"
            print("⚠️  Removing volumes (database data will be deleted)...")
        return self._run_command(cmd)
    
    def restart(self, service=None):
        """Restart services."""
        print("♻️  Restarting services...")
        cmd = "docker-compose restart"
        if service:
            cmd += f" {service}"
        return self._run_command(cmd)
    
    def logs(self, service=None, follow=False):
        """View service logs."""
        cmd = "docker-compose logs"
        if follow:
            cmd += " -f"
        if service:
            cmd += f" {service}"
        return self._run_command(cmd, check=False)
    
    def status(self):
        """Show status of services."""
        print("📊 Service status:")
        return self._run_command("docker-compose ps")
    
    def clean(self):
        """Clean up all containers, images, and volumes."""
        print("🧹 Cleaning up Docker environment...")
        
        # Stop and remove containers
        self.down(volumes=True)
        
        # Remove images
        print("Removing Docker images...")
        images = [
            "dockerhub-mimic-frontend",
            "dockerhub-mimic-backend"
        ]
        for img in images:
            subprocess.run(
                f"docker rmi {img}",
                shell=True,
                capture_output=True
            )
        
        print("✅ Cleanup complete!")
        return True
    
    def exec_service(self, service, command):
        """Execute a command in a running service."""
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
  python run_env.py restart backend    # Restart backend service
  python run_env.py logs -f            # Follow logs
  python run_env.py logs frontend      # View frontend logs
  python run_env.py status             # Show service status
  python run_env.py clean              # Clean up everything
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
            print("\n✅ Services started successfully!")
            print("   Frontend: http://localhost:3000")
            print("   Backend:  http://localhost:8080")
            print("   Database: localhost:5432")
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
    elif args.command == "exec":
        success = manager.exec_service(args.service, " ".join(args.cmd))
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
