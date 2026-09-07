import { Module } from "@nestjs/common";
import { BarbersController } from "./barbers.controller";
import { BarbersAdminController } from "./barbers.admin.controller";
@Module({ controllers: [BarbersController, BarbersAdminController] })
export class BarbersModule {}
