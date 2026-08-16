const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { tasks: { where: { status: { not: 'COMPLETED' } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Success:', projects);
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
