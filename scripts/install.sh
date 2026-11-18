#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() { printf 'Open Cavas: %s\n' "$*" >&2; exit 1; }

usage() {
  printf '%s\n' 'Usage: install.sh [--version vX.Y.Z | --archive FILE.tar.gz]'
}

main() {
  local release=latest/download archive='' expected_version='' platform arch asset base install bin stage target command_path current expected actual version link_stage
  case "${1:-}" in
    --version)
      [[ $# == 2 && $2 =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'Use --version vX.Y.Z.'
      release=download/$2
      expected_version=${2#v} ;;
    --archive)
      [[ $# == 2 && -f $2 && -f $2.sha256 ]] || fail 'Provide the archive and its adjacent .sha256 file.'
      archive=$2 ;;
    -h|--help) usage; return ;;
    '') [[ $# == 0 ]] || fail 'Unexpected empty argument.' ;;
    *) usage >&2; exit 1 ;;
  esac

  case "$(uname -s)" in
    Darwin) platform=darwin ;;
    Linux) platform=linux ;;
    *) fail 'This installer supports macOS and Linux.' ;;
  esac
  case "$(uname -m)" in
    x86_64|amd64) arch=x64 ;;
    arm64|aarch64) arch=arm64 ;;
    *) fail 'This installer supports x64 and arm64.' ;;
  esac
  asset=open-cavas-$platform-$arch.tar.gz
  install=$HOME/.open-canvas/install
  bin=$HOME/.local/bin
  command_path=$bin/open-cavas
  mkdir -p "$install/releases" "$bin"

  if [[ -L $command_path ]]; then
    current=$(readlink "$command_path")
    [[ $current == "$install/releases/"*/bin/open-cavas ||
       $current == "$HOME/.open-cavas/install/releases/"*/bin/open-cavas ]] || fail "Will not replace $command_path."
  elif [[ -e $command_path ]]; then
    fail "Will not replace $command_path."
  fi

  stage=$(mktemp -d "$install/.stage.XXXXXXXX")
  # Expand now so cleanup works after the local variables go out of scope.
  trap "$(printf 'rm -rf -- %q' "$stage")" EXIT
  link_stage=$(mktemp -d "$bin/.open-canvas.XXXXXXXX")
  trap "$(printf 'rm -rf -- %q %q' "$stage" "$link_stage")" EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  if [[ -z $archive ]]; then
    base=https://github.com/utpalsinghdev/open-canvas/releases/$release
    archive=$stage/$asset
    printf 'Downloading %s…\n' "$asset"
    curl --proto '=https' --proto-redir '=https' -fsSL --retry 3 --connect-timeout 10 \
      --speed-limit 1 --speed-time 60 "$base/$asset" -o "$archive" ||
      fail 'Release archive unavailable. Check the GitHub Releases page.'
    curl --proto '=https' --proto-redir '=https' -fsSL --retry 3 --connect-timeout 10 \
      --max-time 30 "$base/$asset.sha256" -o "$archive.sha256" ||
      fail 'Release checksum unavailable.'
  fi

  read -r expected _ < "$archive.sha256" || fail 'Could not read release checksum.'
  [[ $expected =~ ^[a-f0-9]{64}$ ]] || fail 'Malformed release checksum.'
  if command -v sha256sum >/dev/null 2>&1; then
    actual=$(sha256sum < "$archive")
  elif command -v shasum >/dev/null 2>&1; then
    actual=$(shasum -a 256 < "$archive")
  else
    fail 'Install sha256sum or shasum to verify the archive.'
  fi
  [[ ${actual%% *} == "$expected" ]] || fail 'SHA-256 mismatch; existing installation was not changed.'

  target=$install/releases/$expected
  if [[ ! -d $target ]]; then
    mkdir "$stage/bundle"
    tar -xzf "$archive" -C "$stage/bundle"
    version=$("$stage/bundle/bin/open-cavas" --version) || fail 'Bundle cannot run on this machine.'
    [[ -z $expected_version || $version == "$expected_version" ]] || fail 'Archive version does not match the requested tag.'
    # renameSync never moves the release into an existing directory as mv would.
    "$stage/bundle/bin/node" -e '
      const fs = require("node:fs");
      try { fs.renameSync(process.argv[1], process.argv[2]); }
      catch (error) { if (!["EEXIST", "ENOTEMPTY"].includes(error.code)) throw error; }
    ' "$stage/bundle" "$target" || fail 'Could not store the verified archive.'
  else
    version=$("$target/bin/open-cavas" --version) || fail 'Existing bundle cannot run on this machine.'
    [[ -z $expected_version || $version == "$expected_version" ]] || fail 'Archive version does not match the requested tag.'
  fi
  ln -s "$target/bin/open-cavas" "$link_stage/open-cavas"
  mv -f "$link_stage/open-cavas" "$command_path"

  printf 'Installed Open Cavas %s. Run open-cavas to start.\n' "$version"
  if [[ $(command -v open-cavas || true) != "$command_path" ]]; then
    printf 'Run "%s" directly, or put "%s" first on PATH.\n' "$command_path" "$bin"
  fi
}

main "$@"
