import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly configured = Boolean(process.env.DATABASE_URL);
  connected = false;

  async onModuleInit() {
    if (!this.configured) {
      this.logger.warn("DATABASE_URL is not configured; live providers remain available but persistence is offline.");
      return;
    }
    try {
      await this.$connect();
      this.connected = true;
    } catch (error) {
      this.logger.error(`PostgreSQL connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onModuleDestroy() {
    if (this.connected) await this.$disconnect();
  }
}
