# Uplift Backend

Bu proje, Uplift uygulamasının Node.js tabanlı backend API servisidir. Kullanıcı, terapist ve admin işlemleri, randevu yönetimi, ödeme, mesajlaşma ve değerlendirme gibi işlevleri içerir.

## Özellikler

- JWT tabanlı kimlik doğrulama ve rol yönetimi
- Terapist başvuru ve onay sistemi
- Randevu oluşturma, listeleme, iptal ve ödeme (Stripe ile)
- Gerçek zamanlı mesajlaşma (Socket.IO)
- Kullanıcı ve terapist profilleri
- Değerlendirme ve puanlama sistemi
- Haftalık hatırlatma e-postaları (cron job)
- ElasticSearch ile terapist arama

## Kurulum

1. **Bağımlılıkları yükleyin:**
   ```sh
   npm install
   ```

2. **Ortam değişkenlerini ayarlayın:**
   - `backend/.env` dosyasını oluşturun ve aşağıdaki değişkenleri doldurun:
     ```
     MONGODB_URI=...
     JWT_SECRET=...
     STRIPE_SECRET_KEY=...
     EMAIL_USER=...
     EMAIL_PASS=...
     FRONTEND_URL=http://localhost:3000
     CLIENT_URL=http://localhost:3000
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     ```

3. **ElasticSearch başlatmak için:**
   ```sh
   docker run -d \
     --name uplift-elasticsearch \
     -p 9200:9200 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     docker.elastic.co/elasticsearch/elasticsearch:8.6.2
   ```

## Çalıştırma

```sh
node backend/server.js
```

## API Endpointleri

- `/api/auth` - Kimlik doğrulama ve kullanıcı işlemleri
- `/api/therapists` - Terapist başvuruları ve profilleri
- `/api/admin` - Admin işlemleri
- `/api/users` - Kullanıcı profili ve güncelleme
- `/api/appointments` - Randevu işlemleri
- `/api/payment` - Stripe ile ödeme
- `/api/progress` - Kullanıcı ilerleme ve hedefler
- `/api/ratings` - Değerlendirme sistemi
- `/api/chat` - Mesajlaşma ve sohbet

## Katkı

Katkıda bulunmak için lütfen bir pull request gönderin.

---

**Not:** Proje Node.js, Express ve MongoDB kullanır. Gerçek ortamda gizli anahtarlarınızı paylaşmayın.


