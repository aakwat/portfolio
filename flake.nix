{
  description = "Node + TypeScript, for Next.js or React";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          nodejs_24
          pnpm
          typescript
          vtsls
          # From nixpkgs: the npm build ships a workerd binary that does not run on NixOS.
          wrangler
        ];
      };
    };
}
