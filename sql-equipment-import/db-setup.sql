-- SQL Equipment Import — database schema
--
-- Run this ONCE on the Toolbox MariaDB (e.g. via HeidiSQL, mysql CLI, or
-- phpMyAdmin running locally on the toolbox). It cannot be run via the
-- toolbox-sql API because CREATE DATABASE / CREATE TABLE are blocked there.

CREATE DATABASE IF NOT EXISTS `sql_equipment_import`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sql_equipment_import`.`templates` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(150) NOT NULL UNIQUE,    -- e.g. "SLV_105N4627-v2"
  `display_name` VARCHAR(200) NOT NULL,           -- shown in dropdown
  `driver_type`  VARCHAR(50)  NOT NULL,           -- e.g. "SLV", "OJEXHAUST"
  `sql_text`     MEDIUMTEXT   NOT NULL,           -- full template SQL
  `notes`        TEXT,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
