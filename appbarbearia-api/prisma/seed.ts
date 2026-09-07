import { PrismaClient, Role } from "@prisma/client";
import * as argon2 from "argon2";
const prisma = new PrismaClient();
async function main() {
  const shop = await prisma.barbershop.upsert({
    where: { slug: "barbearia-principal" },
    update: {},
    create: { name: "Barbearia Principal", slug: "barbearia-principal" },
  });
  const passwordHash = await argon2.hash("Admin@123456");
  await prisma.user.upsert({
    where: {
      barbershopId_email: {
        barbershopId: shop.id,
        email: "admin@barbearia.local",
      },
    },
    update: {},
    create: {
      barbershopId: shop.id,
      name: "Administrador",
      email: "admin@barbearia.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  const services = [
    { name: "Corte Masculino", duration: 45, price: 30 },
    { name: "Barba", duration: 30, price: 20 },
    { name: "Corte + Barba", duration: 75, price: 45 },
  ];
  for (const s of services)
    await prisma.service.upsert({
      where: { barbershopId_name: { barbershopId: shop.id, name: s.name } },
      update: {},
      create: { ...s, price: s.price, barbershopId: shop.id },
    });
  console.log(`Tenant: ${shop.slug}`);
  console.log("Admin: admin@barbearia.local / Admin@123456");
}
main().finally(() => prisma.$disconnect());
