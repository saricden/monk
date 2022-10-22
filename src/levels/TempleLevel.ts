import { RootLevel } from "./RootLevel";

export class TempleLevel extends RootLevel {
  constructor() {
    super(
      'temple',
      {
        mapKey: 'map-temple',
        tilesetName: 'tiles',
        tilesetKey: 'tiles',
        musicKey: 'ost1'
      }
    );
  }
}