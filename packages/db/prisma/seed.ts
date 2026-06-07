import { config } from "dotenv";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

config();

const prisma = new PrismaClient();

async function main() {
  const companyName = process.env.SEED_COMPANY_NAME ?? "TİGNAL A.Ş.";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@tignal.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";

  // 1) Firma (tek firma — ileride tenant kökü)
  let company = await prisma.company.findFirst({ where: { name: companyName } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: companyName,
        defaultKdv: 20,
        email: adminEmail,
      },
    });
  }

  // 2) Admin kullanıcı
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: adminEmail } },
    update: { passwordHash, role: Role.ADMIN, isActive: true },
    create: {
      companyId: company.id,
      email: adminEmail,
      passwordHash,
      fullName: "Sistem Yöneticisi",
      role: Role.ADMIN,
    },
  });

  // 3) Varsayılan depo
  let warehouse = await prisma.warehouse.findFirst({
    where: { companyId: company.id, isDefault: true },
  });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { companyId: company.id, name: "Merkez Depo", isDefault: true },
    });
  }

  // 4) Örnek kategori ağacı + ürünler (aksesuar örnekleri)
  const kilif = await prisma.category.upsert({
    where: { id: `seed-cat-kilif-${company.id}` },
    update: {},
    create: {
      id: `seed-cat-kilif-${company.id}`,
      companyId: company.id,
      name: "Kılıf",
    },
  });
  await prisma.category.upsert({
    where: { id: `seed-cat-sarj-${company.id}` },
    update: {},
    create: {
      id: `seed-cat-sarj-${company.id}`,
      companyId: company.id,
      name: "Şarj & Kablo",
    },
  });

  const ornekUrunler = [
    {
      name: "Silikon Kılıf (Şeffaf)",
      brand: "Generic",
      categoryId: kilif.id,
      kdvRate: 20,
      defaultCostPrice: "25.0000",
      defaultSalePrice: "59.9000",
    },
    {
      name: "Type-C Hızlı Şarj Kablosu 1m",
      brand: "Generic",
      kdvRate: 20,
      defaultCostPrice: "18.5000",
      defaultSalePrice: "49.9000",
    },
    {
      name: "20W USB-C Şarj Adaptörü",
      brand: "Generic",
      kdvRate: 20,
      defaultCostPrice: "75.0000",
      defaultSalePrice: "159.9000",
    },
  ];

  for (const u of ornekUrunler) {
    const existing = await prisma.product.findFirst({
      where: { companyId: company.id, name: u.name },
    });
    if (!existing) {
      const product = await prisma.product.create({
        data: { companyId: company.id, ...u },
      });
      // Her ürünün varsayılan varyantı
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: "Standart",
          sku: `${product.id.slice(-6).toUpperCase()}-STD`,
          isDefault: true,
          salePrice: u.defaultSalePrice,
          costPrice: u.defaultCostPrice,
        },
      });
    }
  }

  console.log("✔ Seed tamamlandı.");
  console.log(`  Firma : ${company.name}`);
  console.log(`  Admin : ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
