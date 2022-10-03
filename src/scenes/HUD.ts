import { Scene, GameObjects } from "phaser";

export class HUD extends Scene {
  private parentScene?: any;
  private hearts?: GameObjects.Sprite[];
  private txtScore?: any;

  constructor() {
    super('scene-hud');
  }

  init({ parentScene }: { parentScene: any }) {
    this.parentScene = parentScene;
  }

  create() {
    const barGfx = this.add.graphics();
    
    barGfx.fillStyle(0x000000, 0.85);
    barGfx.fillRect(0, window.innerHeight - 40, window.innerWidth, 60);

    this.hearts = [];

    for (let i = 0; i < (this.parentScene.maxHP / 2); i++) {
      this.hearts.push(
        this.add.sprite(20 + i * 40, window.innerHeight - 20, 'ui-heart', 0)
      );
    }

    this.txtScore = this.add.text(window.innerWidth - 20, window.innerHeight - 22, '0', {
      fontSize: '22px',
      color: '#FFF',
      fontFamily: 'Silkscreen'
    });

    this.txtScore.setOrigin(1, 0.5);
  }

  update() {
    const {score} = this.parentScene;
    const {hp, maxHP} = this.parentScene;

    if (this.hearts === undefined) {
      return;
    }

    for (let i = 0; i < maxHP; i++) {
      // this.hearts[i].setFrame(0);
    }

    if (hp === 3.5) {

    }
    else if (hp === 3) {

    }
    else if (hp === 2.5) {

    }
    else if (hp === 2) {

    }
    else if (hp === 1.5) {

    }
    else if (hp === 1) {

    }
    else if (hp === 0.5) {

    }

    this.txtScore.setText(score);
  }
}