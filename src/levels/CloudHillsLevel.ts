import { RootLevel } from "./RootLevel";

export class CloudHillsLevel extends RootLevel {
  constructor() {
    super(
      'cloud-hills',
      {
        mapKey: 'map-cloud-hills',
        tilesetName: 'grassland',
        tilesetKey: 'tileset-grassland',
        musicKey: 'ost2'
      }
    );
  }
}