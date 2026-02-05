-- Extrai todos os CREATE TYPE do schema completo
CREATE TYPE user_role AS ENUM (...);
CREATE TYPE payment_status AS ENUM (...);
-- etc...
```

## 🏗️ Estrutura Detalhada do Backend (NestJS)
```
apps/backend/
├── src/
│   ├── common/
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   └── app.config.ts
│   │   ├── decorators/
│   │   │   ├── tenant.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── tenant.interceptor.ts
│   │   ├── middleware/
│   │   │   ├── tenant.middleware.ts
│   │   │   └── logger.middleware.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-uuid.pipe.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── base-response.dto.ts
│   │   └── interfaces/
│   │       ├── tenant-request.interface.ts
│   │       └── jwt-payload.interface.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── reset-password.dto.ts
│   │   ├── clubs/
│   │   │   ├── clubs.module.ts
│   │   │   ├── clubs.controller.ts
│   │   │   ├── clubs.service.ts
│   │   │   ├── entities/
│   │   │   │   └── club.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-club.dto.ts
│   │   │       └── update-club.dto.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   ├── players/
│   │   │   ├── players.module.ts
│   │   │   ├── players.controller.ts
│   │   │   ├── players.service.ts
│   │   │   ├── entities/
│   │   │   │   └── player.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-player.dto.ts
│   │   │       ├── update-player.dto.ts
│   │   │       └── player-stats.dto.ts
│   │   ├── teams/
│   │   │   ├── teams.module.ts
│   │   │   ├── teams.controller.ts
│   │   │   ├── teams.service.ts
│   │   │   ├── entities/
│   │   │   │   └── team.entity.ts
│   │   │   └── dto/
│   │   ├── trainings/
│   │   │   ├── trainings.module.ts
│   │   │   ├── trainings.controller.ts
│   │   │   ├── trainings.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── training.entity.ts
│   │   │   │   └── training-attendance.entity.ts
│   │   │   └── dto/
│   │   ├── matches/
│   │   │   ├── matches.module.ts
│   │   │   ├── matches.controller.ts
│   │   │   ├── matches.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── match.entity.ts
│   │   │   │   └── match-callup.entity.ts
│   │   │   └── dto/
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── payment.entity.ts
│   │   │   │   └── invoice.entity.ts
│   │   │   ├── dto/
│   │   │   └── processors/
│   │   │       ├── mbway.processor.ts
│   │   │       └── multibanco.processor.ts
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── order.entity.ts
│   │   │   │   └── order-item.entity.ts
│   │   │   └── dto/
│   │   ├── stock/
│   │   │   ├── stock.module.ts
│   │   │   ├── stock.controller.ts
│   │   │   ├── stock.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── stock-item.entity.ts
│   │   │   │   └── stock-movement.entity.ts
│   │   │   └── dto/
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── entities/
│   │   │   │   └── notification.entity.ts
│   │   │   ├── dto/
│   │   │   └── providers/
│   │   │       ├── push-notification.provider.ts
│   │   │       └── email.provider.ts
│   │   └── reports/
│   │       ├── reports.module.ts
│   │       ├── reports.controller.ts
│   │       ├── reports.service.ts
│   │       └── generators/
│   │           ├── financial-report.generator.ts
│   │           └── attendance-report.generator.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── database.service.ts
│   │   └── typeorm.config.ts       # ou prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.development
├── .env.test
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

## 📱 Estrutura do Mobile (Flutter)
```
apps/mobile/
├── android/
├── ios/
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── app_config.dart
│   │   ├── constants/
│   │   │   ├── api_constants.dart
│   │   │   ├── app_colors.dart
│   │   │   └── app_strings.dart
│   │   ├── network/
│   │   │   ├── api_client.dart
│   │   │   ├── api_interceptor.dart
│   │   │   └── network_info.dart
│   │   ├── storage/
│   │   │   └── secure_storage.dart
│   │   ├── utils/
│   │   │   ├── validators.dart
│   │   │   └── date_formatter.dart
│   │   └── errors/
│   │       ├── exceptions.dart
│   │       └── failures.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   ├── repositories/
│   │   │   │   └── datasources/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   └── usecases/
│   │   │   └── presentation/
│   │   │       ├── pages/
│   │   │       ├── widgets/
│   │   │       └── providers/
│   │   ├── players/
│   │   │   └── (mesma estrutura)
│   │   ├── teams/
│   │   ├── trainings/
│   │   ├── payments/
│   │   ├── store/
│   │   └── profile/
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── custom_app_bar.dart
│   │   │   ├── loading_indicator.dart
│   │   │   └── error_widget.dart
│   │   └── theme/
│   │       └── app_theme.dart
│   ├── routes/
│   │   └── app_router.dart
│   └── main.dart
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── test/
├── pubspec.yaml
└── README.md