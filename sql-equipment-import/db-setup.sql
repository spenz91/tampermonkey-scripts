-- SQL Equipment Import — database schema
--
-- Run this ONCE on the Toolbox MariaDB (e.g. via HeidiSQL, mysql CLI, or
-- phpMyAdmin running locally on the toolbox). It cannot be run via the
-- toolbox-sql API because CREATE DATABASE / CREATE TABLE are blocked there.
--
-- Tested on MariaDB / MySQL 5.5.68 (the Toolbox version): MyISAM, utf8mb4,
-- and exactly one TIMESTAMP column with CURRENT_TIMESTAMP defaults (older
-- MySQL rejects two — error #1293).
--
-- The `sql_equipment_import` database may already exist on the toolbox
-- (used by other internal tools); this script just adds a `templates`
-- table alongside whatever is already there. Nothing existing is touched.

CREATE DATABASE IF NOT EXISTS `sql_equipment_import`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `sql_equipment_import`;

CREATE TABLE IF NOT EXISTS `templates` (
  `id`           int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name`         varchar(150) NOT NULL,             -- internal id, e.g. "SLV_105N4627-v2"
  `display_name` varchar(200) NOT NULL,             -- shown in the dropdown
  `driver_type`  varchar(50)  NOT NULL,             -- e.g. "SLV", "OJEXHAUST"
  `sql_text`     mediumtext   NOT NULL,             -- full template SQL
  `notes`        text,
  `created_at`   datetime DEFAULT NULL,             -- userscript writes NOW() on insert
  `updated_at`   timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_driver_type` (`driver_type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
