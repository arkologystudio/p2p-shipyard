{
  description = "Template for Holochain app development";

  inputs = {
    versions.url =
      # "github:holochain/holochain?dir=versions/0_3_rc";
      "github:holochain/holochain/holonix-update/0_3_rc?dir=versions/0_3_rc";

    holochain.url = "github:holochain/holochain";
    holochain.inputs.versions.follows = "versions";

    nixpkgs.follows = "holochain/nixpkgs";
    flake-parts.follows = "holochain/flake-parts";

    tauriHolochain.url = "path:../..";
  };

  outputs = inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      systems = builtins.attrNames inputs.holochain.devShells;
      perSystem = { inputs', config, pkgs, system, ... }: {
        devShells.default = pkgs.mkShell {
          inputsFrom = [ inputs'.tauriHolochain.devShells.holochainTauriDev ];
        };
        devShells.androidDev = pkgs.mkShell {
          inputsFrom =
            [ inputs'.tauriHolochain.devShells.holochainTauriAndroidDev ];
        };
      };
    };
}