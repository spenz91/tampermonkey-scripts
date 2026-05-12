REPLACE INTO `iw_sys_plant_units` (`row_date`, `active`, `blockout`, `unit_id`, `unit_name`, `grp_name`, `driver_type`, `driver_addr`, `regulator_type`, `order_no`, `driver_adr_extra`) VALUES
(NOW(), '1', '0', 'V01', '360.01 Butikk', 'vent_modbus', 'VENT', '0_1', 'VENT', 'VENT', '');

-- SAIA skal ha 1_1 som adresse. Ellers fungerer det ikke :)

REPLACE INTO `iw_sys_plant_settings` (`row_date`, `setting`, `owner`, `value`, `eng_unit`, `help_text`, `help_link`) VALUES
(NOW(), 'comm_port', 'VENT', '6', '', '', ''),
(NOW(), 'mb_tcp_servers', 'VENT', '1;192.168.0.43;502;1000;2;1000\r\n', '', 'ID;IPadr;IPport;ConnTout;ConnRetries;RequestTout', ''),
(NOW(), 'mb_mode', 'VENT', '0', '', '0=RTU|1=ASCII|2=TCP', ''),
(NOW(), 'mb_request_retries', 'VENT', '2', '', '', ''),
(NOW(), 'force_word_not_byte', 'VENT', '0', '', '0|1', ''),
(NOW(), 'handshake', 'VENT', '0', '', '0|1|2', ''),
(NOW(), 'check_rate', 'VENT', '1', 'ms', '', ''),
(NOW(), 'comm_parity', 'VENT', '0', '', '0=N|1=O|2=E|3=M|4=S', ''),
(NOW(), 'comm_data_bits', 'VENT', '8', '', '', ''),
(NOW(), 'comm_stop_bits', 'VENT', '1', '', '', ''),
(NOW(), 'comm_baudrate', 'VENT', '9600', '', '', ''),
(NOW(), 'max_outstanding_packets', 'VENT', '-1', '', '', ''),
(NOW(), 'packet_timeout', 'VENT', '1', 'sec.', '', ''),
(NOW(), 'idle_event_rate', 'VENT', '250', 'msec.', '', ''),
(NOW(), 'sql_queue_poll_time', 'VENT', '2000', 'msec.', '', ''),
(NOW(), 'max_error_count', 'VENT', '2', '', '', ''),
(NOW(), 'mb_request_timeout', 'VENT', '1000', 'ms', '', ''),
(NOW(), 'com_error_alarm_delay', 'VENT', '10', 'min.', '', ''),
(NOW(), 'show_queue_info', 'VENT', '0', '', '', ''),
(NOW(), 'speed_index_block', 'VENT', '10', '', '', ''),
(NOW(), 'speed_index_offline', 'VENT', '10', '', '', ''),
(NOW(), 'speed_index_slow', 'VENT', '1', '', '', ''),
(NOW(), 'speed_index_norm', 'VENT', '1', '', '', ''),
(NOW(), 'max_param_block_time', 'VENT', '2', 'hours', '', ''),
(NOW(), 'max_group_count', 'VENT', '1', '', '', ''),
(NOW(), 'value_quality_check_limit', 'VENT', '0', '', '0 = disabled', ''),
(NOW(), 'mux_settle_time', 'VENT', '1500', 'ms', 'Time for the muxed input to settle. The value shuld be a multiple off 100.', ''),
(NOW(), 'startup_delay', 'VENT', '15', 'Sec.', '', ''),
(NOW(), 'alarm_handler', 'VENT', '', '', '', ''),
(NOW(), 'mb_tcp_connect_retries_default', 'VENT', '2', '', '', ''),
(NOW(), 'mb_tcp_connect_timeout_default', 'VENT', '1000', 'ms', '', '');

REPLACE INTO `iw_sys_processes` (`row_date`, `man_start`, `path`, `process_name`, `process_id`, `process_status`) VALUES
(NOW(), '0', 'iw_mb.exe', 'VENT', '', '');

REPLACE INTO `iw_sys_order_no` (`row_date`, `order_no`, `db_link`, `group_link`) VALUES
(NOW(), 'VENT', 'vent_modbus_param', 'vent_modbus_groups');

CREATE TABLE IF NOT EXISTS `iw_par_vent_modbus_groups` (
  `row_date` datetime NOT NULL DEFAULT '2004-01-10 00:00:00',
  `type` varchar(50) NOT NULL DEFAULT '',
  `view_order` mediumint(6) NOT NULL DEFAULT '0',
  `ref` varchar(100) NOT NULL DEFAULT '',
  `value` varchar(200) NOT NULL DEFAULT '',
  UNIQUE KEY `type` (`type`,`view_order`,`ref`,`value`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='2.0.0';

CREATE TABLE IF NOT EXISTS `iw_par_vent_modbus_param` (
  `row_date` datetime NOT NULL DEFAULT '2004-01-01 00:00:00',
  `element_id` varchar(100) NOT NULL DEFAULT '',
  `driver_id` varchar(100) NOT NULL DEFAULT '',
  `alias_text` text NOT NULL,
  `menu` varchar(10) NOT NULL DEFAULT '',
  `application` text NOT NULL,
  `parameter_type` text NOT NULL,
  `factory_setting` text NOT NULL,
  `grp` text NOT NULL,
  `att` text NOT NULL,
  `eng_unit` varchar(20) NOT NULL DEFAULT '',
  `format` varchar(20) NOT NULL DEFAULT '',
  `range_min` text NOT NULL,
  `range_max` text NOT NULL,
  `scale` varchar(15) NOT NULL DEFAULT '',
  `raw_min` varchar(15) NOT NULL DEFAULT '',
  `raw_max` varchar(15) NOT NULL DEFAULT '',
  `eng_min` varchar(15) NOT NULL DEFAULT '',
  `eng_max` varchar(15) NOT NULL DEFAULT '',
  `driver_id_extra` varchar(255) NOT NULL DEFAULT '',
  `format_extra` text NOT NULL,
  UNIQUE KEY `element_id` (`element_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='3.2.3';

CREATE TABLE IF NOT EXISTS `iw_set_vent_modbus` (
  `row_date` datetime NOT NULL DEFAULT '2004-01-10 00:00:00',
  `element_id` varchar(100) NOT NULL DEFAULT '',
  `active` enum('0','1') NOT NULL DEFAULT '0',
  `onl_ind` enum('0','1') NOT NULL DEFAULT '1',
  `update_freq` set('','fast','norm','slow','once','never') NOT NULL DEFAULT 'norm',
  `save_data` varchar(20) NOT NULL DEFAULT 'change',
  `save_freq` varchar(20) NOT NULL DEFAULT '',
  `plant_pri` char(1) NOT NULL DEFAULT '',
  `sys_pri` char(1) NOT NULL DEFAULT '',
  `alarm_type` tinyint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`element_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='4.0.0';

-- Changelog
--
--
-- v1 orginal
-- v2 - rettet flere feil i settingstabellen. La ogs� til innstillingene for � sette IP adressen med en gang.