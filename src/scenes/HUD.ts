import { Scene } from "phaser";

export class HUD extends Scene {
  private parentScene?: any;
  private hearts?: any[];
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

    for (let i = 0; i < this.parentScene.maxHP; i++) {
      this.hearts.push(
        this.add.sprite(20 + i * 40, window.innerHeight - 20, 'ui-heart', 0)
      );
    }

    this.txtScore = this.add.text(window.innerWidth - 20, window.innerHeight - 20, '0', {
      fontSize: '16px',
      color: '#FFF',
      fontFamily: 'sans-serif'
    });

    this.txtScore.setOrigin(1, 0.5);
  }

  update() {
    const {score} = this.parentScene;
    // console.log(this.hearts[0].frame);
    // const {hp, maxHP} = this.parentScene;

    // for (let i = maxHP; i > hp; i -= 0.5) {
    //   if (this.hearts[i].anims.current)
    // }

    this.txtScore.setText(score);
  }
}