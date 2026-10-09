# 11 — Mercado Pago desde cero (guía para tu primera integración)

> Es tu primera vez con MP: esta guía no da nada por sentado. Lee en orden. Si algo no te suena, frena y pregúntame antes de tocar código.
> Todo Uruguay. No asumo comisiones ni plazos: donde haya plata de por medio te digo dónde verificarlo en el panel oficial.

## 0. Glosario en criollo (5 min)
- **Cuenta Mercado Pago:** billetera del cliente (persona o empresa). Ahí entra la plata. No es lo mismo que Mercado Libre, aunque se entra con el mismo usuario.
- **Link de pago:** botón que el dueño crea a mano en el panel MP (ej: "Cómoda $12.000"). Sin programar. Sirve día 1.
- **Checkout Pro:** página de MP donde paga el comprador (tarjeta, débito, transferencia, dinero en cuenta). Nosotros la invocamos desde la web y MP nos devuelve el resultado.
- **Preferencia (preference):** "orden de pago" que crea nuestro servidor. Dice: qué se vende, cuánto (UYU), a dónde volver si sale bien/mal. MP responde con un `preference_id` + URL de pago (`init_point`).
- **Pago (payment):** cuando el comprador paga, MP crea un `payment_id` con estado `approved / pending / rejected`.
- **Webhook (IPN):** aviso automático que MP manda a nuestro servidor ("che, el pago 123 se aprobó"). Sin esto, la web nunca se entera sola.
- **Credenciales:** llaves. `Public Key` (se puede mostrar) + `Access Token` (SECRETO, como contraseña). Hay juego TEST (juguete) y PROD (plata real). Nunca mezclar.
- **Back URLs:** a dónde vuelve el comprador tras pagar: `/pago/exito`, `/pago/fallo`, `/pago/pendiente`. Ojo: volver a la web ≠ pago confirmado. Lo único confiable es el webhook.

## 1. Qué necesitas tener a mano (checklist físico)
- [ ] Email + contraseña de la cuenta MP del cliente (cuenta ya verificada ✅ según cuestionario)
- [ ] Celular para 2FA / WhatsApp
- [ ] Cuenta bancaria uruguaya del cliente (para retirar el dinero después)
- [ ] 30 min tranquilos, navegador actualizado
- [ ] Este repo + archivo `.env` (lo creamos juntos, nunca se commitea)

## 2. Paso 1 — Entrar y verificar (10 min, sin código)
1. Entra a mercadopago.com.uy con la cuenta del cliente.
2. Ve a Tu perfil / Datos y confirma: identidad validada, email y celular verificados, cuenta bancaria vinculada.
3. Pregunta clave al cliente (precios los ves con él, pero anota): ¿a qué banco quiere retirar y cada cuánto concilia?
4. No toques nada de "credenciales" todavía. Eso va en paso 4.

## 3. Paso 2 — Cobrar hoy sin programar: link de pago (15 min)
Para vender una pieza esta semana sin esperar desarrollo:
1. En panel MP: Cobrar → Crear link de pago → título (ej: "Cómoda restaurada - LG"), monto UYU, foto opcional.
2. Copia el link y pégalo en WhatsApp o en la ficha `/piezas` como botón provisorio.
3. Cuando pagan, el dinero aparece en Actividad MP. Lo marcas a mano en tu planilla.
4. Límite: conciliación manual (tú ves MP + WhatsApp). Por eso después automatizamos con Checkout Pro.

Haz 1 link de prueba de $10 UYU y págalo tú mismo para ver el flujo completo.

## 4. Paso 3 — Credenciales TEST (cuando quieras integrar, 10 min)
1. Entra a developers.mercadopago.com → Tus aplicaciones → Crear aplicación (nombre: "lgrestoreuy-test").
2. Copia **TEST Public Key** y **TEST Access Token**. Guárdalas en `.env.local` (nunca en Git):
   ```
   MP_PUBLIC_KEY_TEST=...
   MP_ACCESS_TOKEN_TEST=...
   MP_WEBHOOK_SECRET_TEST=...
   ```
3. Crea **usuarios de prueba**: Vendedor TEST + Comprador TEST con saldo ficticio. Con esos dos vas a simular compras sin plata real.
4. Regla de oro: TEST solo habla con TEST. Si mezclas TEST con PROD, falla y es normal.

## 5. Paso 4 — Flujo integrado (qué vamos a programar, explicado)
```
Ficha pieza ($UYU) → click Pagar → servidor crea preferencia (TEST)
→ redirige a Checkout Pro MP → comprador TEST paga
→ MP redirige a /pago/exito|fallo|pendiente (solo informativo)
→ MP manda webhook a /api/mercadopago/webhook (lo confiable)
→ validamos firma → marcamos orders=pagada → pieces=vendida → avisamos WhatsApp
```
Tú solo programas 2 endpoints (ver `08-definicion-final.md`). El resto lo hace MP.

## 6. Paso 5 — Probar sin miedo (lista exacta)
Con credenciales TEST + usuarios prueba:
- [ ] Pago aprobado → orden `pagada`, pieza `vendida`, desaparece de disponibles
- [ ] Pago rechazado (tarjeta sin fondos TEST) → orden `fallida`, pieza sigue `disponible`
- [ ] Pago pendiente (transferencia TEST) → orden `pendiente`, pieza `reservada`
- [ ] Webhook llega y valida firma (log 200). Si no llega: URL debe ser HTTPS pública (Vercel preview sirve), no localhost.
- [ ] Botones volver (éxito/fallo/pendiente) muestran mensaje correcto aunque el webhook tarde.

## 7. Paso 6 — Pasar a PROD (plata real, con calma)
Solo cuando TEST esté verde:
1. En la app MP cambia a credenciales PROD (`MP_*_PROD` en Vercel, nunca en código).
2. Haz **1 cobro real chico** ($20–$50 UYU) con tu propia tarjeta y devuélvelo desde el panel (practicas devolución).
3. Verifica: dinero en cuenta MP → retiro a banco UY (MP muestra costo/plazo en el panel, no lo asumo aquí).
4. Publica Términos + Devoluciones en `/legal` (los redactas con el cliente) y logo/nombre tienda en checkout.

## 8. Errores típicos primera vez (y qué hacer)
- "Invalid access token" → estás usando TEST en PROD o viceversa. Revisa `.env`.
- "Webhook no llega" → URL localhost o sin HTTPS, o firma mal validada. Usa URL Vercel + logs.
- "Vuelvo a /exito pero no figura pago" → normal: la confirmación real es el webhook, no la vuelta. Muestra "estamos confirmando".
- "Mezclé links manuales con órdenes" → decide por pieza: o link manual o Checkout Pro, no ambos a la vez.
- "Subí Access Token a Git" → revócalo YA en panel developers y genera otro.

## 9. Qué NO hago por ti (límites honestos)
- No defino comisiones ni plazos de retiro: se verifican en panel MP UY / developers (cambian por medio y fecha).
- No emito factura DGI: MP no factura por ti. Facturación electrónica Uruguay es aparte.
- No defino precios ni devoluciones: eso lo cierras con el cliente (pendiente).

## 10. Tu próxima acción (10 min)
1. Haz el link de $10 UYU y cobra tu prueba.
2. Crea la app TEST y mándame (por privado, nunca por chat grupal): `Public Key TEST` + confirmación de usuarios prueba creados.
3. Yo preparo los 2 endpoints + páginas `/pago/*` y probamos juntos.

Glosario rápido para el cliente (copiable a WhatsApp):
> "Vamos a cobrar con Mercado Pago Uruguay. Hoy con links manuales para no frenar ventas, y en la web con botón que lleva al pago seguro de MP. La confirmación llega sola y la pieza se marca vendida. La comisión la cobra MP por venta, la ves en tu panel."
