import { Scene, GameObjects } from "phaser";

export class HUD extends Scene {
  private parentScene?: any;
  private hearts?: GameObjects.Sprite[];
  private txtFeathers?: any;
  private gfxBtn!: any;
  private txtBtn!: any;
  private btnCallback?: Function;

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

    const featherIcon = this.add.sprite(window.innerWidth - 20, window.innerHeight - 22, 'feather');
    featherIcon.setOrigin(1, 0.5);

    this.txtFeathers = this.add.text(window.innerWidth - 20 - featherIcon.displayWidth - 10, window.innerHeight - 22, '0', {
      fontSize: '22px',
      color: '#FFF',
      fontFamily: 'Silkscreen'
    });

    this.txtFeathers.setOrigin(1, 0.5);

    this.gfxBtn = this.add.graphics();
    this.gfxBtn.fillStyle(0x000000, 0.85);
    this.gfxBtn.lineStyle(1, 0xFFFFFF, 1);
    this.gfxBtn.fillRect(20, window.innerHeight - 40 - 60 - 20, window.innerWidth - 40, 60);
    this.gfxBtn.strokeRect(20, window.innerHeight - 40 - 60 - 20, window.innerWidth - 40, 60);
    this.gfxBtn.setAlpha(0);

    this.txtBtn = this.add.text(window.innerWidth / 2, window.innerHeight - 40 - 52, '', {
      fontSize: '22px',
      color: '#FFF',
      fontFamily: 'Silkscreen',
      align: 'center'
    });
    this.txtBtn.setOrigin(0.5);
    this.txtBtn.setAlpha(0);

    this.txtBtn.setInteractive();

    this.txtBtn.on('pointerup', () => {
      if (this.txtBtn.alpha === 1) {
        this.doPressBtn();
      }
    });
  }

  update() {
    const {feathers} = this.parentScene;
    const {hp} = this.parentScene;

    if (this.hearts === undefined) {
      return;
    }

    const hpPerHeart = 2;

    for (let i = 0; i < this.hearts.length; i++) {
      const heartHP = Math.max(Math.min(hpPerHeart, hp - i * hpPerHeart), 0);
      const frame = 2 - heartHP;

      this.hearts[i].setFrame(frame);
    }

    this.txtFeathers.setText(feathers);
  }

  public showBtn(labelTxt: string, callback: Function) {
    if (this.txtBtn.text === '') {
      this.txtBtn.setText(labelTxt);
      this.btnCallback = callback;
  
      this.tweens.add({
        targets: [this.txtBtn, this.gfxBtn],
        alpha: 1,
        duration: 750
      });
    }
  }

  public hideBtn() {
    if (this.txtBtn.text !== '') {
      this.tweens.add({
        targets: [this.txtBtn, this.gfxBtn],
        alpha: 0,
        duration: 750,
        onComplete: () => {
          this.txtBtn.setText('');
          this.btnCallback = undefined;
        }
      });
    }
  }

  doPressBtn() {
    if (this.btnCallback) {
      this.btnCallback();
    }
  }
}