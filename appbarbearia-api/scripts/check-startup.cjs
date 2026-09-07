// Verifica a resolução de dependências sem conectar ao banco nem abrir portas.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { ConfigService } = require('@nestjs/config');
const { AppModule } = require('../dist/app.module');
const { PrismaService } = require('../dist/prisma.service');
const { AuthService } = require('../dist/auth/auth.service');

async function main() {
  const databaseStub = {};
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(databaseStub)
    .overrideProvider(ConfigService)
    .useValue(new ConfigService({
      JWT_ACCESS_SECRET: 'startup-check-access-not-for-production',
      JWT_REFRESH_SECRET: 'startup-check-refresh-not-for-production',
    }))
    .compile();
  try {
    await moduleRef.init();
    assert.ok(moduleRef.get(AuthService));
    assert.equal(moduleRef.get(PrismaService), databaseStub);
    console.log('Inicialização verificada: dependências dos módulos resolvidas sem banco.');
  } finally {
    await moduleRef.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
