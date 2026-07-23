import Phaser from 'phaser'
import { GameScene } from '../scenes/GameScene'
import { BootScene } from '../scenes/BootScene'
import { GAME_CONFIG } from './gameConstants'

export const gameConfig = {
  type: Phaser.AUTO,

  width: GAME_CONFIG.SCREEN_WIDTH,
  height: GAME_CONFIG.SCREEN_HEIGHT,

  backgroundColor: '#1d1d1d',

  parent: 'app',

  scene: [
      BootScene,
      GameScene
  ]
}