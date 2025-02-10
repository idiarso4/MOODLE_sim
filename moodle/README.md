# Moodle Docker Installation

## Kredensial Default

### Moodle
- URL: http://localhost:8080
- Admin Username: admin
- Admin Password: admin_password

### PHPMyAdmin
- URL: http://localhost:8081
- Username: root
- Password: moodle_root_password

## Cara Menjalankan

1. Pastikan Docker Desktop sudah berjalan
2. Buka terminal di folder ini
3. Jalankan perintah:
   ```bash
   docker-compose up -d
   ```

## Cara Menghentikan

```bash
docker-compose down
```

## Backup Data
Data tersimpan di Docker volumes:
- moodle_data: untuk file Moodle
- moodledb_data: untuk database

## Mengakses Moodle
1. Buka browser
2. Kunjungi http://localhost:8080
3. Login dengan kredensial admin di atas

## Mengakses Database
1. Buka browser
2. Kunjungi http://localhost:8081
3. Login dengan kredensial PHPMyAdmin di atas
