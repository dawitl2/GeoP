import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "./database/database.module";
import { IntelligenceController } from "./intelligence/intelligence.controller";
import { IntelligenceService } from "./intelligence/intelligence.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HttpModule.register({ timeout: 20_000, maxRedirects: 5 }),
    DatabaseModule,
  ],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
})
export class AppModule {}
