#!/bin/bash
echo "Setting up Git..."

# 1. Install Git (if missing)
if ! command -v git &> /dev/null; then
    echo "Git not found. Attempting to install..."
    # Try apt-get (Debian/Ubuntu)
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y git
    # Try apk (Alpine)
    elif command -v apk &> /dev/null; then
        sudo apk add git
    # Try yum (CentOS/RHEL)
    elif command -v yum &> /dev/null; then
        sudo yum install -y git
    else
        echo "Could not find package manager. Please install git manually."
        exit 1
    fi
else
    echo "Git is already installed."
fi

# 2. Initialize Repo
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git branch -M main
else
    echo "Git repository already initialized."
fi

# 3. Configure (Prompt user if needed, or use defaults for now)
if [ -z "$(git config --global user.email)" ]; then
    echo "Configuring default git user..."
    git config --global user.email "user@example.com"
    git config --global user.name "Cocktail Builder User"
fi

# 4. Status
echo "Ready! You can now use git commands."
git status
