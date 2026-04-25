import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        // Inisialisasi Scanner untuk input user
        Scanner input = new Scanner(System.in);
        
        // Data sederhana menggunakan Array
        String[] daftarProduk = {"Laptop", "Smartphone", "Headset", "Monitor"};
        int[] hargaProduk = {8000000, 3000000, 500000, 2000000};
        
        boolean lanjutBelanja = true;
        long totalBelanja = 0;

        System.out.println("=== Selamat Datang di Kak Gem Tech Store ===");

        // Perulangan While agar program terus berjalan sampai user selesai
        while (lanjutBelanja) {
            System.out.println("\nMenu Produk:");
            for (int i = 0; i < daftarProduk.length; i++) {
                System.out.println((i + 1) + ". " + daftarProduk[i] + " (Rp " + hargaProduk[i] + ")");
            }
            System.out.println("5. Keluar & Bayar");
            
            System.out.print("\nPilih produk (1-5): ");
            int pilihan = input.nextInt();

            // Struktur Switch-Case untuk logika pemilihan
            switch (pilihan) {
                case 1:
                    System.out.println("Menambahkan " + daftarProduk[0] + " ke keranjang.");
                    totalBelanja += hargaProduk[0];
                    break;
                case 2:
                    System.out.println("Menambahkan " + daftarProduk[1] + " ke keranjang.");
                    totalBelanja += hargaProduk[1];
                    break;
                case 3:
                    System.out.println("Menambahkan " + daftarProduk[2] + " ke keranjang.");
                    totalBelanja += hargaProduk[2];
                    break;
                case 4:
                    System.out.println("Menambahkan " + daftarProduk[3] + " ke keranjang.");
                    totalBelanja += hargaProduk[3];
                    break;
                case 5:
                    lanjutBelanja = false;
                    break;
                default:
                    System.out.println("Pilihan tidak valid, coba lagi ya.");
            }
        }

        // Output Akhir
        System.out.println("\n-------------------------------------------");
        System.out.println("Total tagihan Anda: Rp " + totalBelanja);
        
        // Contoh logika diskon menggunakan If-Else
        if (totalBelanja > 5000000) {
            long diskon = totalBelanja * 10 / 100;
            totalBelanja -= diskon;
            System.out.println("Selamat! Anda dapat diskon 10%: Rp " + diskon);
            System.out.println("Total yang harus dibayar: Rp " + totalBelanja);
        }

        System.out.print("Masukkan nominal uang pembayaran: ");
        long uangDibayar = input.nextLong();

        if (uangDibayar >= totalBelanja) {
            System.out.println("Kembalian Anda: Rp " + (uangDibayar - totalBelanja));
            System.out.println("Terima kasih sudah berbelanja di Kak Gem Tech!");
        } else {
            System.out.println("Uang Anda kurang Rp " + (totalBelanja - uangDibayar) + ". Mohon cuci piring dulu.");
        }

        input.close(); // Menutup resource scanner
    }
}