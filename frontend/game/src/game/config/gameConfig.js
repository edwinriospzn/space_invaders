import Phaser from 'phaser'
import { GameScene } from '../scenes/GameScene'
import { BootScene } from '../scenes/BootScene'


export const gameConfig = {
  type: Phaser.AUTO,

  width: 800,
  height: 600,

  backgroundColor: '#1d1d1d',

  parent: 'app',

  scene: [
      BootScene,
      GameScene
  ]
}