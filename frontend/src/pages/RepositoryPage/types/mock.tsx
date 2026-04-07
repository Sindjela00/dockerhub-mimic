import type { RepositoryDetail } from "./types";

export const MOCK_REPO_DETAIL: RepositoryDetail = {
  id: 1,
  name: "nginx",
  fullName: "john.doe/nginx",
  description:
    "Official build of Nginx — high performance HTTP server and reverse proxy.",
  visibility: "public",
  ownerEmail: "john@example.com",
  isOfficial: false,
  starCount: 48,
  tags: ["latest", "1.25", "alpine", "1.24", "stable"],
  createdAt: "2023-01-15T08:00:00Z",
  updatedAt: "2025-03-10T12:00:00Z",
  readme: `## nginx

A high performance web server and reverse proxy.

### Usage

\`\`\`bash
docker pull john.doe/nginx:latest
docker run -d -p 80:80 john.doe/nginx
\`\`\`

### Supported tags

- \`latest\` — latest stable release
- \`alpine\` — minimal Alpine-based image
- \`1.25\`, \`1.24\` — specific versions
`,
  tagDetails: [
    {
      name: "latest",
      digest: "sha256:a3b4c5d6e7f8",
      size: "54.2 MB",
      pushedAt: "2025-03-10T12:00:00Z",
      os: "linux",
      arch: "amd64",
    },
    {
      name: "1.25",
      digest: "sha256:b4c5d6e7f8a9",
      size: "54.1 MB",
      pushedAt: "2025-02-20T10:00:00Z",
      os: "linux",
      arch: "amd64",
    },
    {
      name: "alpine",
      digest: "sha256:c5d6e7f8a9b0",
      size: "12.8 MB",
      pushedAt: "2025-03-10T12:00:00Z",
      os: "linux",
      arch: "amd64",
    },
    {
      name: "1.24",
      digest: "sha256:d6e7f8a9b0c1",
      size: "53.9 MB",
      pushedAt: "2025-01-15T09:00:00Z",
      os: "linux",
      arch: "amd64",
    },
    {
      name: "stable",
      digest: "sha256:e7f8a9b0c1d2",
      size: "54.2 MB",
      pushedAt: "2025-03-10T12:00:00Z",
      os: "linux",
      arch: "amd64",
    },
  ],
};
