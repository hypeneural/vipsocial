<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('news_raw_items') && Schema::hasColumn('news_raw_items', 'raw_url')) {
            $this->changeColumn('news_raw_items', function (Blueprint $table): void {
                $table->text('raw_url')->change();
            }, 'ALTER TABLE `news_raw_items` MODIFY `raw_url` TEXT NOT NULL');
        }

        if (Schema::hasTable('news_items')) {
            if (Schema::hasColumn('news_items', 'url')) {
                $this->changeColumn('news_items', function (Blueprint $table): void {
                    $table->text('url')->change();
                }, 'ALTER TABLE `news_items` MODIFY `url` TEXT NOT NULL');
            }

            if (Schema::hasColumn('news_items', 'raw_url')) {
                $this->changeColumn('news_items', function (Blueprint $table): void {
                    $table->text('raw_url')->change();
                }, 'ALTER TABLE `news_items` MODIFY `raw_url` TEXT NOT NULL');
            }

            if (Schema::hasColumn('news_items', 'subtitle')) {
                $this->changeColumn('news_items', function (Blueprint $table): void {
                    $table->text('subtitle')->nullable()->change();
                }, 'ALTER TABLE `news_items` MODIFY `subtitle` TEXT NULL');
            }

            if (Schema::hasColumn('news_items', 'hero_image_url')) {
                $this->changeColumn('news_items', function (Blueprint $table): void {
                    $table->text('hero_image_url')->nullable()->change();
                }, 'ALTER TABLE `news_items` MODIFY `hero_image_url` TEXT NULL');
            }
        }

        if (Schema::hasTable('news_item_media') && Schema::hasColumn('news_item_media', 'url')) {
            $this->changeColumn('news_item_media', function (Blueprint $table): void {
                $table->text('url')->change();
            }, 'ALTER TABLE `news_item_media` MODIFY `url` TEXT NOT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('news_raw_items') && Schema::hasColumn('news_raw_items', 'raw_url')) {
            $this->changeColumn('news_raw_items', function (Blueprint $table): void {
                $table->string('raw_url')->change();
            }, 'ALTER TABLE `news_raw_items` MODIFY `raw_url` VARCHAR(255) NOT NULL');
        }

        if (Schema::hasTable('news_items')) {
            if (Schema::hasColumn('news_items', 'url')) {
                $this->changeColumn('news_items', function (Blueprint $table): void {
                    $table->string('url')->change();
                }, 'ALTER TABLE `news_items` MODIFY `url` VARCHAR(255) NOT NULL');
            }

            if (Schema::hasColumn('news_items', 'raw_url')) {
                $this->changeColumn('news_items', function (Blueprint $table): void {
                    $table->string('raw_url')->change();
                }, 'ALTER TABLE `news_items` MODIFY `raw_url` VARCHAR(255) NOT NULL');
            }

            if (Schema::hasColumn('news_items', 'subtitle')) {
                $this->changeColumn('news_items', function (Blueprint $table): void {
                    $table->string('subtitle')->nullable()->change();
                }, 'ALTER TABLE `news_items` MODIFY `subtitle` VARCHAR(255) NULL');
            }

            if (Schema::hasColumn('news_items', 'hero_image_url')) {
                $this->changeColumn('news_items', function (Blueprint $table): void {
                    $table->string('hero_image_url')->nullable()->change();
                }, 'ALTER TABLE `news_items` MODIFY `hero_image_url` VARCHAR(255) NULL');
            }
        }

        if (Schema::hasTable('news_item_media') && Schema::hasColumn('news_item_media', 'url')) {
            $this->changeColumn('news_item_media', function (Blueprint $table): void {
                $table->string('url')->change();
            }, 'ALTER TABLE `news_item_media` MODIFY `url` VARCHAR(255) NOT NULL');
        }
    }

    private function changeColumn(string $table, \Closure $schemaChange, string $mysqlStatement): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement($mysqlStatement);

            return;
        }

        Schema::table($table, $schemaChange);
    }
};
