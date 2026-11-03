import * as migration_20261103_032129_inicial from './20261103_032129_inicial';

export const migrations = [
  {
    up: migration_20261103_032129_inicial.up,
    down: migration_20261103_032129_inicial.down,
    name: '20261103_032129_inicial'
  },
];
