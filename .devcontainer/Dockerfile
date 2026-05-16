FROM mcr.microsoft.com/devcontainers/base:ubuntu

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    gnupg \
    jq \
    lsb-release \
    make \
    shellcheck \
    unzip \
    wget \
    zip \
  && rm -rf /var/lib/apt/lists/*

# Language and profile-specific tools are installed by generated overlays.
