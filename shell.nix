{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = [
    pkgs.gnumake
    pkgs.gcc
    pkgs.curl
    pkgs.python3
    pkgs.python3Packages.pandas
    pkgs.python3Packages.pip
    pkgs.nodejs_20  # Specifying a newer Node.js version
    pkgs.nodePackages.npm
    pkgs.nodePackages.yarn
    pkgs.nodePackages.pnpm  # Optional alternative package manager
    # For websockets support
    pkgs.nodePackages."socket.io"  # Fixed package name with quotes to handle the dot

    # Development tools
    pkgs.nodePackages.typescript
  ];
  nativeBuildInputs = [
    pkgs.pkg-config
  ];
  shellHook = ''
    echo "Next.js Development Environment activated!"
    echo "To create a new Next.js app, run: npx create-next-app@latest"
  '';
}