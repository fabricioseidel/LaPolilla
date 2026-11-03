import * as migration_20261103_032129_inicial from './20261103_032129_inicial';
import * as migration_20261103_123150_integracion from './20261103_123150_integracion';

export const migrations = [
  {
    up: migration_20261103_032129_inicial.up,
    down: migration_20261103_032129_inicial.down,
    name: '20261103_032129_inicial',
  },
  {
    up: migration_20261103_123150_integracion.up,
    down: migration_20261103_123150_integracion.down,
    name: '20261103_123150_integracion'
  },
];
