import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

/**
 * Bayi izolasyonu için iskelet guard (Phase 2'de aktifleşecek).
 *
 * DEALER rolündeki kullanıcının yalnızca kendi `dealerId`'sine ait kayıtlara
 * erişmesini garanti eder. Şu an servis katmanında dealer scope filtresi
 * uygulanana kadar request üzerine scope bilgisi ekler.
 *
 * Kullanım (Phase 2): controller'larda @UseGuards(DealerScopeGuard) ve
 * servislerde request.dealerScope ile zorunlu filtre.
 */
@Injectable()
export class DealerScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    req.dealerScope =
      user?.role === "DEALER" ? { dealerId: user.dealerId } : null;
    return true;
  }
}
