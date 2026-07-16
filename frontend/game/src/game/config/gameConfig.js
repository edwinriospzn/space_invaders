import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'

export const gameConfig = {
  type: Phaser.AUTO,

  width: 800,
  height: 600,

  backgroundColor: '#1d1d1d',

  parent: 'app',

  scene: [BootScene]
}