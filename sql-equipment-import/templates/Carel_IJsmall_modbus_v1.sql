
--

CREATE TABLE IF NOT EXISTS `iw_par_ca_ijfsmall_param` (
  `row_date` datetime NOT NULL DEFAULT '2017-01-01 00:00:00',
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
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='4.0.0';

--
-- Dumping data for table `iw_par_ca_ijfsmall_param`
--

REPLACE INTO `iw_par_ca_ijfsmall_param` (`row_date`, `element_id`, `driver_id`, `alias_text`, `menu`, `application`, `parameter_type`, `factory_setting`, `grp`, `att`, `eng_unit`, `format`, `range_min`, `range_max`, `scale`, `raw_min`, `raw_max`, `eng_min`, `eng_max`, `driver_id_extra`, `format_extra`) VALUES
('2023-04-20 08:38:56', '243_D_37', '243_D_37', 'Call defrost', 'FId', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_37_X_N_5_37_X_N', ''),
('2023-04-20 08:38:56', '164_A_42', '164_A_42', 'Maximum temperature setpoint', 'r2', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_42_I16_N_6_42_I16_N', ''),
('2023-04-20 08:38:56', '242_D_44', '242_D_44', 'Enable defrost', 'FIc', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_44_X_N_5_44_X_N', ''),
('2023-04-20 08:38:56', '529_I_15', '529_I_15', 'Time band 2 - minute', 'td2-mm', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '59', '', '', '', '', '', '3_15_U16_N_6_15_U16_N', ''),
('2023-04-20 08:38:56', '166_A_76', '166_A_76', 'Automatic night-time set point variation', 'r4', 'Analog Values', 'float', '', '', 'rw', '', '%.1f', '', '', '', '', '', '', '', '3_76_I16_N_6_76_I16_N', ''),
('2023-04-20 08:38:56', '226_D_15', '226_D_15', 'Display navigation', '/nE', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_15_X_N_5_15_X_N', ''),
('2023-04-20 08:38:56', '303_A_54', '303_A_54', 'Humidity setpoint', 'Sth', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '100', '', '', '', '', '', '3_54_I16_N_6_54_I16_N', ''),
('2023-04-20 08:38:56', '300_A_53', '300_A_53', 'Dehumidification differential', 'rrH', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '50', '', '', '', '', '', '3_53_I16_N_6_53_I16_N', ''),
('2023-04-20 08:38:56', '279_D_12', '279_D_12', 'Defrost command', 'dfM', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_12_X_N_5_12_X_N', ''),
('2023-04-20 08:38:56', '413_I_19', '413_I_19', 'Time band 4 - day', 'td4-d', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '11', '', '', '', '', '', '3_19_U16_N_6_19_U16_N', ''),
('2023-04-20 08:38:56', '263_D_13', '263_D_13', 'Working time reset', 'HMr', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_13_X_N_5_13_X_N', ''),
('2023-04-20 08:38:56', '254_D_38', '254_D_38', 'Change configuration', 'FIo', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_38_X_N_5_38_X_N', ''),
('2023-04-20 08:38:56', '113_A_35', '113_A_35', 'Temperature alarms reset differential', 'A0', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '0.1', '20', '', '', '', '', '', '3_35_I16_N_6_35_I16_N', ''),
('2023-04-20 08:38:56', '259_D_47', '259_D_47', 'Low pressure switch', 'FIt', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_47_X_N_5_47_X_N', ''),
('2023-04-20 08:38:56', '114_D_21', '114_D_21', 'Alarm thresholds (AL, AH) relative to the set point St or absolute', 'A1', 'Digital IO', 'boolean', '', '', 'rw', '', '', '', '', '', '', '', '', '', '2_21_X_N_5_21_X_N', ''),
('2023-04-20 08:38:56', '352_A_21', '352_A_21', 'Auxiliary temperature 2', 'Aux2', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_21_I16_N_6_21_I16_N', ''),
('2023-04-20 08:38:56', '251_D_16', '251_D_16', 'Bluetooth communication', 'BtE', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_16_X_N_5_16_X_N', ''),
('2023-04-20 08:38:56', '521_I_20', '521_I_20', 'Time band 4 - hour', 'td4-hh', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '23', '', '', '', '', '', '3_20_U16_N_6_20_U16_N', ''),
('2023-04-20 08:38:56', '137_A_36', '137_A_36', 'High temperature alarm threshold', 'AH', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '200', '', '', '', '', '', '3_36_I16_N_6_36_I16_N', ''),
('2023-04-20 08:38:56', '141_A_37', '141_A_37', 'Low temperature alarm threshold', 'AL', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '200', '', '', '', '', '', '3_37_I16_N_6_37_I16_N', ''),
('2023-04-20 08:38:56', '253_I_30', '253_I_30', 'Current defrost status', 'dFS', 'Integral Values', 'integer', '', '', 'r', '', '', '0', '5', '', '', '', '', '', '3_30_U16_N_6_30_U16_N', ''),
('2023-04-20 08:38:56', '214_A_46', '214_A_46', 'Regulation temperature differential', 'rd', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '0.1', '99.90000000000001', '', '', '', '', '', '3_46_I16_N_6_46_I16_N', ''),
('2023-04-20 08:38:56', '224_A_44', '224_A_44', 'Neutral zone', 'rn', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '0', '60', '', '', '', '', '', '3_44_I16_N_6_44_I16_N', ''),
('2023-04-20 08:38:56', '228_A_45', '228_A_45', 'Reverse differential temperature', 'rr', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '0.1', '20', '', '', '', '', '', '3_45_I16_N_6_45_I16_N', ''),
('2023-04-20 08:38:56', '262_D_18', '262_D_18', 'Alarms reset', 'rSA', 'Digital IO', 'boolean', '', '', 'rw', '', '', '', '', '', '', '', '', '', '2_18_X_N_5_18_X_N', ''),
('2023-04-20 08:38:56', '535_I_33', '535_I_33', 'Time band 8 - minute', 'td8-mm', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '59', '', '', '', '', '', '3_33_U16_N_6_33_U16_N', ''),
('2023-04-20 08:38:56', '412_I_16', '412_I_16', 'Time band 3 - day', 'td3-d', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '11', '', '', '', '', '', '3_16_U16_N_6_16_U16_N', ''),
('2023-04-20 08:38:56', '306_D_17', '306_D_17', 'Reset monitoring session', 'rtL', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_17_X_N_5_17_X_N', ''),
('2023-04-20 08:38:56', '148_I_7', '148_I_7', 'Defrost type', 'd0', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '4', '', '', '', '', '', '3_7_U16_N_6_7_U16_N', ''),
('2023-04-20 08:38:56', '148_A_19', '148_A_19', 'Ambient temperature', 'SA', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_19_I16_N_6_19_I16_N', ''),
('2023-04-20 08:38:56', '279_A_29', '279_A_29', 'Working differential', 'rdA', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '', '', '', '', '', '', '', '3_29_I16_N_6_29_I16_N', ''),
('2023-04-20 08:38:56', '317_A_26', '317_A_26', 'Glass temperature', 'Svt', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_26_I16_N_6_26_I16_N', ''),
('2023-04-20 08:38:56', '284_D_70', '284_D_70', 'Defrost status', 'dFr', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_70_X_N_5_70_X_N', ''),
('2023-04-20 08:38:56', '154_I_49', '154_I_49', 'Display during defrost', 'd6', 'Integral Values', 'integer', '', '', 'rw', '', '', '', '', '', '', '', '', '', '3_49_U16_N_6_49_U16_N', ''),
('2023-04-20 08:38:56', '156_I_0', '156_I_0', 'High temperature alarm delay after defrost', 'd8', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '240', '', '', '', '', '', '3_0_U16_N_6_0_U16_N', ''),
('2023-04-20 08:38:56', '237_A_71', '237_A_71', 'Custom 2 : Humidity regulation setpoint', 'Sh2', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '100', '', '', '', '', '', '3_71_I16_N_6_71_I16_N', ''),
('2023-04-20 08:38:56', '236_A_70', '236_A_70', 'Custom 1 : Humidity regulation setpoint', 'Sh1', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '100', '', '', '', '', '', '3_70_I16_N_6_70_I16_N', ''),
('2023-04-20 08:38:56', '239_A_73', '239_A_73', 'Custom 4 : Humidity regulation setpoint', 'Sh4', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '100', '', '', '', '', '', '3_73_I16_N_6_73_I16_N', ''),
('2023-04-20 08:38:56', '238_A_72', '238_A_72', 'Custom 3 : Humidity regulation setpoint', 'Sh3', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '100', '', '', '', '', '', '3_72_I16_N_6_72_I16_N', ''),
('2023-04-20 08:38:56', '241_A_75', '241_A_75', 'Custom 6 : Humidity regulation setpoint', 'Sh6', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '100', '', '', '', '', '', '3_75_I16_N_6_75_I16_N', ''),
('2023-04-20 08:38:56', '530_I_18', '530_I_18', 'Time band 3 - minute', 'td3-mm', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '59', '', '', '', '', '', '3_18_U16_N_6_18_U16_N', ''),
('2023-04-20 08:38:56', '240_A_74', '240_A_74', 'Custom 5 : Humidity regulation setpoint', 'Sh5', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '100', '', '', '', '', '', '3_74_I16_N_6_74_I16_N', ''),
('2023-04-20 08:38:56', '173_I_1', '173_I_1', 'Defrost interval', 'dI', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '240', '', '', '', '', '', '3_1_U16_N_6_1_U16_N', ''),
('2023-04-20 08:38:56', '249_D_20', '249_D_20', 'AUX command', 'AuC', 'Digital IO', 'boolean', '', '', 'rw', '', '', '', '', '', '', '', '', '', '2_20_X_N_5_20_X_N', ''),
('2023-04-20 08:38:56', '182_A_22', '182_A_22', 'Condenser temperature', 'Sc', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_22_I16_N_6_22_I16_N', ''),
('2023-04-20 08:38:56', '183_A_23', '183_A_23', 'Defrost temperature', 'Sd', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_23_I16_N_6_23_I16_N', ''),
('2023-04-20 08:38:56', '318_A_51', '318_A_51', 'Humidity differential', 'rdh', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0.1', '20', '', '', '', '', '', '3_51_I16_N_6_51_I16_N', ''),
('2023-04-20 08:38:56', '267_A_25', '267_A_25', 'Antifreeze temperature', 'SFr', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_25_I16_N_6_25_I16_N', ''),
('2023-04-20 08:38:56', '200_I_40', '200_I_40', 'Dripping time', 'dd', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '15', '', '', '', '', '', '3_40_U16_N_6_40_U16_N', ''),
('2023-04-20 08:38:56', '199_A_47', '199_A_47', 'Regulation setpoint', 'St', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_47_I16_N_6_47_I16_N', ''),
('2023-04-20 08:38:56', '192_A_17', '192_A_17', 'Outlet temperature', 'Sm', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_17_I16_N_6_17_I16_N', ''),
('2023-04-20 08:38:56', '197_A_18', '197_A_18', 'Intake temperature', 'Sr', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_18_I16_N_6_18_I16_N', ''),
('2023-04-20 08:38:56', '264_A_6', '264_A_6', 'Regulation temperature working setpoint', 'ASt', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_6_I16_N_6_6_I16_N', ''),
('2023-04-20 08:38:56', '201_A_8', '201_A_8', 'Virtual probe', 'Sv', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_8_I16_N_6_8_I16_N', ''),
('2023-04-20 08:38:56', '533_I_27', '533_I_27', 'Time band 6 - minute', 'td6-mm', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '59', '', '', '', '', '', '3_27_U16_N_6_27_U16_N', ''),
('2023-04-20 08:38:56', '415_I_25', '415_I_25', 'Time band 6 - day', 'td6-d', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '11', '', '', '', '', '', '3_25_U16_N_6_25_U16_N', ''),
('2023-04-20 08:38:56', '422_I_79', '422_I_79', 'Current minute', 'RTC_Vars.S', 'Integral Values', 'integer', '', '', 'r', '', '', '', '', '', '', '', '', '', '3_79_U16_N_6_79_U16_N', ''),
('2023-04-20 08:38:56', '218_D_63', '218_D_63', 'Light', 'FOE', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_63_X_N_5_63_X_N', ''),
('2023-04-20 08:38:56', '221_D_54', '221_D_54', 'Auxiliary defrost', 'FOH', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_54_X_N_5_54_X_N', ''),
('2023-04-20 08:38:56', '220_D_53', '220_D_53', 'Defrost', 'FOG', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_53_X_N_5_53_X_N', ''),
('2023-04-20 08:38:56', '222_D_59', '222_D_59', 'Evaporator Fan', 'FOI', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_59_X_N_5_59_X_N', ''),
('2023-04-20 08:38:56', '302_A_20', '302_A_20', 'Auxiliary temperature', 'Aux', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_20_I16_N_6_20_I16_N', ''),
('2023-04-20 08:38:56', '229_D_58', '229_D_58', 'Drain heaters', 'FOP', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_58_X_N_5_58_X_N', ''),
('2023-04-20 08:38:56', '528_I_12', '528_I_12', 'Time band 1 - minute', 'td1-mm', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '59', '', '', '', '', '', '3_12_U16_N_6_12_U16_N', ''),
('2023-04-20 08:38:56', '531_I_81', '531_I_81', 'Current year', 'RTC_Vars.S', 'Integral Values', 'integer', '', '', 'r', '', '', '', '', '', '', '', '', '', '3_81_U16_N_6_81_U16_N', ''),
('2023-04-20 08:38:56', '525_I_32', '525_I_32', 'Time band 8 - hour', 'td8-hh', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '23', '', '', '', '', '', '3_32_U16_N_6_32_U16_N', ''),
('2023-04-20 08:38:56', '118_I_60', '118_I_60', 'Evaporator fan management', 'F0', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '3', '', '', '', '', '', '3_60_U16_N_6_60_U16_N', ''),
('2023-04-20 08:38:56', '247_D_48', '247_D_48', 'Alarm', 'FOb', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_48_X_N_5_48_X_N', ''),
('2023-04-20 08:38:56', '255_D_56', '255_D_56', 'Dehumidification heaters', 'FOj', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_56_X_N_5_56_X_N', ''),
('2023-04-20 08:38:56', '272_A_27', '272_A_27', 'Humidity probe', 'SHu', 'Analog Values', 'float', '', '', 'r', '%rH', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_27_I16_N_6_27_I16_N', ''),
('2023-04-20 08:38:56', '520_I_17', '520_I_17', 'Time band 3 - hour', 'td3-hh', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '23', '', '', '', '', '', '3_17_U16_N_6_17_U16_N', ''),
('2023-04-20 08:38:56', '256_D_51', '256_D_51', 'Auxiliary compressor without rotation', 'FOk', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_51_X_N_5_51_X_N', ''),
('2023-04-20 08:38:56', '259_D_64', '259_D_64', 'Liquid Valve', 'FOn', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_64_X_N_5_64_X_N', ''),
('2023-04-20 08:38:56', '262_D_65', '262_D_65', 'Rail heaters', 'FOq', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_65_X_N_5_65_X_N', ''),
('2023-04-20 08:38:56', '265_D_52', '265_D_52', 'Condenser fan', 'FOt', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_52_X_N_5_52_X_N', ''),
('2023-04-20 08:38:56', '264_D_60', '264_D_60', 'Generic stage 1', 'FOs', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_60_X_N_5_60_X_N', ''),
('2023-04-20 08:38:56', '267_D_66', '267_D_66', 'Auxiliary reverse with neutral zone', 'FOv', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_66_X_N_5_66_X_N', ''),
('2023-04-20 08:38:56', '414_I_22', '414_I_22', 'Time band 5 - day', 'td5-d', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '11', '', '', '', '', '', '3_22_U16_N_6_22_U16_N', ''),
('2023-04-20 08:38:56', '266_D_62', '266_D_62', 'Humidification', 'FOu', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_62_X_N_5_62_X_N', ''),
('2023-04-20 08:38:56', '248_D_49', '248_D_49', 'AUX', 'FOc', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_49_X_N_5_49_X_N', ''),
('2023-04-20 08:38:56', '269_D_61', '269_D_61', 'Gasket heater', 'FOx', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_61_X_N_5_61_X_N', ''),
('2023-04-20 08:38:56', '268_D_57', '268_D_57', 'Auxiliary parallel compressor', 'FOw', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_57_X_N_5_57_X_N', ''),
('2023-04-20 08:38:56', '271_D_55', '271_D_55', 'External dehumidifier', 'FOz', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_55_X_N_5_55_X_N', ''),
('2023-04-20 08:38:56', '270_D_50', '270_D_50', 'Auxiliary compressor with rotation', 'FOy', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_50_X_N_5_50_X_N', ''),
('2023-04-20 08:38:56', '170_I_41', '170_I_41', 'Post dripping time', 'Fd', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '15', '', '', '', '', '', '3_41_U16_N_6_41_U16_N', ''),
('2023-04-20 08:38:56', '200_A_11', '200_A_11', 'Evaporator Fan', 'FAA', 'Analog Values', 'float', '', '', 'r', '%', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_11_I16_N_6_11_I16_N', ''),
('2023-04-20 08:38:56', '205_A_13', '205_A_13', 'Light', 'FAF', 'Analog Values', 'float', '', '', 'r', '%', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_13_I16_N_6_13_I16_N', ''),
('2023-04-20 08:38:56', '204_A_10', '204_A_10', 'Condenser Fan', 'FAE', 'Analog Values', 'float', '', '', 'r', '%', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_10_I16_N_6_10_I16_N', ''),
('2023-04-20 08:38:56', '534_I_30', '534_I_30', 'Time band 7 - minute', 'td7-mm', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '59', '', '', '', '', '', '3_30_U16_N_6_30_U16_N', ''),
('2023-04-20 08:38:56', '206_A_9', '206_A_9', 'Compressor', 'FAG', 'Analog Values', 'float', '', '', 'r', '%', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_9_I16_N_6_9_I16_N', ''),
('2023-04-20 08:38:56', '128_I_61', '128_I_61', 'Output switched with scheduler', 'H8', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '3_61_U16_N_6_61_U16_N', ''),
('2023-04-20 08:38:56', '202_A_85', '202_A_85', 'Absolute high temperature alarm relative threshold', 'AHA', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-100', '537', '', '', '', '', '', '3_85_I16_N_6_85_I16_N', ''),
('2023-04-20 08:38:56', '148_I_38', '148_I_38', 'Light analog output value', 'HL', 'Integral Values', 'integer', '', '', 'rw', '%', '', '0', '4', '', '', '', '', '', '3_38_U16_N_6_38_U16_N', ''),
('2023-04-20 08:38:56', '518_I_11', '518_I_11', 'Time band 1 - hour', 'td1-hh', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '23', '', '', '', '', '', '3_11_U16_N_6_11_U16_N', ''),
('2023-04-20 08:38:56', '235_A_12', '235_A_12', 'Generic modulation 1', 'FAd', 'Analog Values', 'float', '', '', 'r', '%', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_12_I16_N_6_12_I16_N', ''),
('2023-04-20 08:38:56', '234_A_14', '234_A_14', 'Rails', 'FAc', 'Analog Values', 'float', '', '', 'r', '%', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_14_I16_N_6_14_I16_N', ''),
('2023-04-20 08:38:56', '157_I_50', '157_I_50', 'humidity management level', 'HU', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '2', '', '', '', '', '', '3_50_U16_N_6_50_U16_N', ''),
('2023-04-20 08:38:56', '417_I_31', '417_I_31', 'Time band 8 - day', 'td8-d', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '11', '', '', '', '', '', '3_31_U16_N_6_31_U16_N', ''),
('2023-04-20 08:38:56', '244_D_2', '244_D_2', 'Continuous cycle', 'CnC', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_2_X_N_5_2_X_N', ''),
('2023-04-20 08:38:56', '170_D_1', '170_D_1', 'Buzzer', 'Hb', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_1_X_N_5_1_X_N', ''),
('2023-04-20 08:38:56', '365_I_31', '365_I_31', 'Software version', 'MiskVars.S', 'Integral Values', 'integer', '', '', 'r', '', '', '', '', '', '', '', '', '', '3_31_U16_N_6_31_U16_N', ''),
('2023-04-20 08:38:56', '532_I_24', '532_I_24', 'Time band 5 - minute', 'td5-mm', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '59', '', '', '', '', '', '3_24_U16_N_6_24_U16_N', ''),
('2023-04-20 08:38:56', '156_I_63', '156_I_63', 'Configuration to upload', 'IS', 'Integral Values', 'integer', '', '', 'rw', '', '', '', '', '', '', '', '', '', '3_63_U16_N_6_63_U16_N', ''),
('2023-04-20 08:38:56', '229_I_2', '229_I_2', 'Maximum defrost duration', 'dP1', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '1', '240', '', '', '', '', '', '3_2_U16_N_6_2_U16_N', ''),
('2023-04-20 08:38:56', '230_I_4', '230_I_4', 'Maximum defrost duration auxiliary evaporator', 'dP2', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '1', '240', '', '', '', '', '', '3_4_U16_N_6_4_U16_N', ''),
('2023-04-20 08:38:56', '544_I_78', '544_I_78', 'Current hour', 'RTC_Vars.S', 'Integral Values', 'integer', '', '', 'r', '', '', '', '', '', '', '', '', '', '3_78_U16_N_6_78_U16_N', ''),
('2023-04-20 08:38:56', '524_I_29', '524_I_29', 'Time band 7 - hour', 'td7-hh', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '23', '', '', '', '', '', '3_29_U16_N_6_29_U16_N', ''),
('2023-04-20 08:38:56', '416_I_28', '416_I_28', 'Time band 7 - day', 'td7-d', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '11', '', '', '', '', '', '3_28_U16_N_6_28_U16_N', ''),
('2023-04-20 08:38:56', '519_I_14', '519_I_14', 'Time band 2 - hour', 'td2-hh', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '23', '', '', '', '', '', '3_14_U16_N_6_14_U16_N', ''),
('2023-04-20 08:38:56', '648_I_80', '648_I_80', 'Current month', 'RTC_Vars.S', 'Integral Values', 'integer', '', '', 'r', '', '', '', '', '', '', '', '', '', '3_80_U16_N_6_80_U16_N', ''),
('2023-04-20 08:38:56', '603_I_15', '603_I_15', 'Unit working mode', 'W_mode', 'Integral Values', 'integer', '', '', 'r', '', '', '', '', '', '', '', '', '', '3_15_U16_N_6_15_U16_N', ''),
('2023-04-20 08:38:56', '692_I_0', '692_I_0', 'HW_CONFIG', 'HW_CONFIG', 'Integral Values', 'integer', '', '', 'r', '', '', '0', '32767', '', '', '', '', '', '3_0_U16_N_6_0_U16_N', ''),
('2023-04-20 08:38:56', '206_A_84', '206_A_84', 'Absolute low temperature alarm relative threshold', 'ALA', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-100', '537', '', '', '', '', '', '3_84_I16_N_6_84_I16_N', ''),
('2023-04-20 08:38:56', '197_I_6', '197_I_6', 'Defrost time in ?Running time&quot; mode', 'd10', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '', '', '', '', '', '', '', '3_6_U16_N_6_6_U16_N', ''),
('2023-04-20 08:38:56', '522_I_23', '522_I_23', 'Time band 5 - hour', 'td5-hh', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '23', '', '', '', '', '', '3_23_U16_N_6_23_U16_N', ''),
('2023-04-20 08:38:56', '198_A_8', '198_A_8', 'Defrost temperature threshold in &quot;Running time&quot; mode', 'd11', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_8_I16_N_6_8_I16_N', ''),
('2023-04-20 08:38:56', '203_I_56', '203_I_56', 'No-downward tendency check time', 'd16', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '', '240', '', '', '', '', '', '3_56_U16_N_6_56_U16_N', ''),
('2023-04-20 08:38:56', '411_I_13', '411_I_13', 'Time band 2 - day', 'td2-d', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '11', '', '', '', '', '', '3_13_U16_N_6_13_U16_N', ''),
('2023-04-20 08:38:56', '296_A_52', '296_A_52', 'Humidity dead band', 'rnH', 'Analog Values', 'float', '', '', 'rw', '%rH', '%.1f', '0', '50', '', '', '', '', '', '3_52_I16_N_6_52_I16_N', ''),
('2023-04-20 08:38:56', '248_D_3', '248_D_3', 'DAY status / ECO mode', 'dAS', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_3_X_N_5_3_X_N', ''),
('2023-04-20 08:38:56', '265_A_3', '265_A_3', 'End defrost temperature', 'dt1', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_3_I16_N_6_3_I16_N', ''),
('2023-04-20 08:38:56', '199_I_9', '199_I_9', 'Number of defrosts before RSF alarm ', 'd21', 'Integral Values', 'integer', '', '', 'rw', '', '', '1', '5', '', '', '', '', '', '3_9_U16_N_6_9_U16_N', ''),
('2023-04-20 08:38:56', '198_I_57', '198_I_57', 'Sampling time for tendency evaluation', 'd20', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '240', '', '', '', '', '', '3_57_U16_N_6_57_U16_N', ''),
('2023-04-20 08:38:56', '266_A_5', '266_A_5', 'End defrost temperature axiliary evap.', 'dt2', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_5_I16_N_6_5_I16_N', ''),
('2023-04-20 08:38:56', '200_A_39', '200_A_39', 'Temperature gap for tendency evaluation', 'd22', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '0.1', '0.5', '', '', '', '', '', '3_39_I16_N_6_39_I16_N', ''),
('2023-04-20 08:38:56', '255_I_32', '255_I_32', 'Cumulative Alarms', 'ALr', 'Integral Values', 'integer', '', '', 'r', '', '', '', '', '', '', '', '', '', '3_32_U16_N_6_32_U16_N', ''),
('2023-04-20 08:38:56', '268_A_7', '268_A_7', 'Regulation temperature', 'SrG', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_7_I16_N_6_7_I16_N', ''),
('2023-04-20 08:38:56', '249_D_19', '249_D_19', 'NFC memory', 'nFE', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_19_X_N_5_19_X_N', ''),
('2023-04-20 08:38:56', '277_A_28', '277_A_28', 'Product temperature', 'SPr', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_28_I16_N_6_28_I16_N', ''),
('2023-04-20 08:38:56', '260_A_55', '260_A_55', 'Temperature differential to enable humidity control', 'TdL', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '0', '20', '', '', '', '', '', '3_55_I16_N_6_55_I16_N', ''),
('2023-04-20 08:38:56', '231_A_64', '231_A_64', 'Custom 1 : Temperature regulation setpoint', 'Sc1', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_64_I16_N_6_64_I16_N', ''),
('2023-04-20 08:38:56', '531_I_21', '531_I_21', 'Time band 4 - minute', 'td4-mm', 'Integral Values', 'integer', '', '', 'rw', 'min', '', '0', '59', '', '', '', '', '', '3_21_U16_N_6_21_U16_N', ''),
('2023-04-20 08:38:56', '233_A_66', '233_A_66', 'Custom 3 : Temperature regulation setpoint', 'Sc3', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_66_I16_N_6_66_I16_N', ''),
('2023-04-20 08:38:56', '416_I_77', '416_I_77', 'Current day', 'RTC_Vars.S', 'Integral Values', 'integer', '', '', 'r', '', '', '', '', '', '', '', '', '', '3_77_U16_N_6_77_U16_N', ''),
('2023-04-20 08:38:56', '232_A_65', '232_A_65', 'Custom 2 : Temperature regulation setpoint', 'Sc2', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_65_I16_N_6_65_I16_N', ''),
('2023-04-20 08:38:56', '235_A_68', '235_A_68', 'Custom 5 : Temperature regulation setpoint', 'Sc5', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_68_I16_N_6_68_I16_N', ''),
('2023-04-20 08:38:56', '234_A_67', '234_A_67', 'Custom 4 : Temperature regulation setpoint', 'Sc4', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_67_I16_N_6_67_I16_N', ''),
('2023-04-20 08:38:56', '236_A_69', '236_A_69', 'Custom 6 : Temperature regulation setpoint', 'Sc6', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_69_I16_N_6_69_I16_N', ''),
('2023-04-20 08:38:56', '410_I_10', '410_I_10', 'Time band 1 - day', 'td1-d', 'Integral Values', 'integer', '', '', 'rw', '', '', '0', '11', '', '', '', '', '', '3_10_U16_N_6_10_U16_N', ''),
('2023-04-20 08:38:56', '619_I_62', '619_I_62', 'Setpoint index', 'St_idx', 'Integral Values', 'integer', '', '', 'rw', '', '', '', '', '', '', '', '', '', '3_62_U16_N_6_62_U16_N', ''),
('2023-04-20 08:38:56', '215_D_39', '215_D_39', 'Continuous cycle start/stop', 'FIH', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_39_X_N_5_39_X_N', ''),
('2023-04-20 08:38:56', '100_D_11', '100_D_11', 'Unit of measure', '/5', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_11_X_N_5_11_X_N', ''),
('2023-04-20 08:38:56', '101_D_14', '101_D_14', 'Decimal point visualization', '/6', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_14_X_N_5_14_X_N', ''),
('2023-04-20 08:38:56', '229_I_58', '229_I_58', 'Maintenance hours threshold (hours x1000)', 'HMP', 'Integral Values', 'integer', '', '', 'rw', '', '', '', '', '', '', '', '', '', '3_58_U16_N_6_58_U16_N', ''),
('2023-04-20 08:38:56', '523_I_26', '523_I_26', 'Time band 6 - hour', 'td6-hh', 'Integral Values', 'integer', '', '', 'rw', 'h', '', '0', '23', '', '', '', '', '', '3_26_U16_N_6_26_U16_N', ''),
('2023-04-20 08:38:56', '228_D_36', '228_D_36', 'Auxiliary digital input', 'FIU', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_36_X_N_5_36_X_N', ''),
('2023-04-20 08:38:56', '163_A_43', '163_A_43', 'Minimum temperature setpoint', 'r1', 'Analog Values', 'float', '', '', 'rw', '°C/°F', '%.1f', '-50', '50', '', '', '', '', '', '3_43_I16_N_6_43_I16_N', ''),
('2023-04-20 08:38:56', '208_D_35', '208_D_35', 'Immediate external alarm', 'FIA', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_35_X_N_5_35_X_N', ''),
('2023-04-20 08:38:56', '233_A_24', '233_A_24', 'Auxiliary defrost temperature', 'Sd2', 'Analog Values', 'float', '', '', 'r', '°C/°F', '%.1f', '-32768', '3276.7', '', '', '', '', '', '3_24_I16_N_6_24_I16_N', ''),
('2023-04-20 08:38:56', '213_D_46', '213_D_46', 'Remote ON/OFF', 'FIF', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_46_X_N_5_46_X_N', ''),
('2023-04-20 08:38:56', '212_D_42', '212_D_42', 'Door status - Regulation OFF', 'FIE', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_42_X_N_5_42_X_N', ''),
('2023-04-20 08:38:56', '214_D_40', '214_D_40', 'Curtain switch', 'FIG', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_40_X_N_5_40_X_N', ''),
('2023-04-20 08:38:56', '223_D_43', '223_D_43', 'Door status - Regulation ON', 'FIP', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_43_X_N_5_43_X_N', ''),
('2023-04-20 08:38:56', '226_D_45', '226_D_45', 'Digital input for generic function alarm', 'FIS', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_45_X_N_5_45_X_N', ''),
('2023-04-20 08:38:56', '241_D_41', '241_D_41', 'Delayed external alarm', 'FIb', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_41_X_N_5_41_X_N', ''),
('2023-04-20 08:38:56', '296_D_10', '296_D_10', 'Light', 'Lht', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_10_X_N_5_10_X_N', ''),
('2023-04-20 08:38:56', '214_D_67', '214_D_67', 'Solenoid/Compressor', 'FOA', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_67_X_N_5_67_X_N', ''),
('2023-04-20 08:38:56', '234_I_16', '234_I_16', 'Variable speed compressor reading', 'fCA', 'Integral Values', 'integer', '', '', 'r', 'rpm', '', '', '', '', '', '', '', '', '3_16_U16_N_6_16_U16_N', ''),
('2023-04-20 08:38:56', '315_I_33', '315_I_33', 'Variable speed compressor request', 'vSr', 'Integral Values', 'integer', '', '', 'r', 'Hz', '', '', '', '', '', '', '', '', '3_33_U16_N_6_33_U16_N', ''),
('2023-04-20 08:38:56', '189_D_0', '189_D_0', 'On-off command', 'On', 'Digital IO', 'boolean', '', '', 'rw', '', '', '0', '1', '', '', '', '', '', '2_0_X_N_5_0_X_N', ''),
('2023-04-20 08:38:56', '214_D_33', '214_D_33', 'High voltage detection', 'EHI', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_33_X_N_5_33_X_N', ''),
('2023-04-20 08:38:56', '226_D_6', '226_D_6', 'Generic function 1 low difference alarm', 'GLO', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_6_X_N_5_6_X_N', ''),
('2023-04-20 08:38:56', '183_D_22', '183_D_22', 'Control probe fault', 'rE', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_22_X_N_5_22_X_N', ''),
('2023-04-20 08:38:56', '180_D_15', '180_D_15', 'Maximum pump down time alarm', 'Pd', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_15_X_N_5_15_X_N', ''),
('2023-04-20 08:38:56', '267_D_23', '267_D_23', 'Refrigerant System Failure Alarm', 'rSF', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_23_X_N_5_23_X_N', ''),
('2023-04-20 08:38:56', '165_D_27', '165_D_27', 'Delayed external alarm', 'dA', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_27_X_N_5_27_X_N', ''),
('2023-04-20 08:38:56', '264_D_16', '264_D_16', 'Autostart in pump down', 'AtS', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_16_X_N_5_16_X_N', ''),
('2023-04-20 08:38:56', '136_D_31', '136_D_31', 'Configuration writing error', 'CE', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_31_X_N_5_31_X_N', ''),
('2023-04-20 08:38:56', '221_D_69', '221_D_69', 'Probe alarms', 'PAL', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_69_X_N_5_69_X_N', ''),
('2023-04-20 08:38:56', '224_D_68', '224_D_68', 'Low voltage detection', 'ELO', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_68_X_N_5_68_X_N', ''),
('2023-04-20 08:38:56', '118_D_17', '118_D_17', 'Probe S1 alarm', 'E1', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_17_X_N_5_17_X_N', ''),
('2023-04-20 08:38:56', '119_D_18', '119_D_18', 'Probe S2 alarm', 'E2', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_18_X_N_5_18_X_N', ''),
('2023-04-20 08:38:56', '120_D_19', '120_D_19', 'Probe S3 alarm', 'E3', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_19_X_N_5_19_X_N', ''),
('2023-04-20 08:38:56', '121_D_20', '121_D_20', 'Probe S4 alarm', 'E4', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_20_X_N_5_20_X_N', ''),
('2023-04-20 08:38:56', '122_D_21', '122_D_21', 'Probe S5 alarm', 'E5', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_21_X_N_5_21_X_N', ''),
('2023-04-20 08:38:56', '123_D_80', '123_D_80', 'Probe S1H alarm', 'E6', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_80_X_N_5_80_X_N', ''),
('2023-04-20 08:38:56', '124_D_81', '124_D_81', 'Probe S2H alarm', 'E7', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_81_X_N_5_81_X_N', ''),
('2023-04-20 08:38:56', '255_D_2', '255_D_2', 'Dirty condenser alarm', 'CHt', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_2_X_N_5_2_X_N', ''),
('2023-04-20 08:38:56', '319_D_34', '319_D_34', 'Dirty condenser pre-alarm', 'cht', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_34_X_N_5_34_X_N', ''),
('2023-04-20 08:38:56', '249_D_4', '249_D_4', 'Antifreeze alarm', 'AFr', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_4_X_N_5_4_X_N', ''),
('2023-04-20 08:38:56', '137_D_7', '137_D_7', 'HACCP alarm - HA', 'HA', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_7_X_N_5_7_X_N', ''),
('2023-04-20 08:38:56', '142_D_8', '142_D_8', 'HACCP alarm - HF', 'HF', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_8_X_N_5_8_X_N', ''),
('2023-04-20 08:38:56', '145_D_9', '145_D_9', 'High temperature alarm', 'HI', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_9_X_N_5_9_X_N', ''),
('2023-04-20 08:38:56', '430_D_71', '430_D_71', 'VCC - Wrong rotor position', 'S_ca8', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_71_X_N_5_71_X_N', ''),
('2023-04-20 08:38:56', '431_D_72', '431_D_72', 'VCC - Over Temperature Fail', 'S_ca9', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_72_X_N_5_72_X_N', ''),
('2023-04-20 08:38:56', '428_D_77', '428_D_77', 'VCC - Under Speed', 'S_ca6', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_77_X_N_5_77_X_N', ''),
('2023-04-20 08:38:56', '429_D_78', '429_D_78', 'VCC - Short Circuit', 'S_ca7', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_78_X_N_5_78_X_N', ''),
('2023-04-20 08:38:56', '426_D_75', '426_D_75', 'VCC - Start Fail', 'S_ca4', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_75_X_N_5_75_X_N', ''),
('2023-04-20 08:38:56', '427_D_76', '427_D_76', 'VCC - Overload Condition', 'S_ca5', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_76_X_N_5_76_X_N', ''),
('2023-04-20 08:38:56', '424_D_74', '424_D_74', 'VCC - Set speed data out of specification while the comp is running', 'S_ca2', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_74_X_N_5_74_X_N', ''),
('2023-04-20 08:38:56', '138_D_28', '138_D_28', 'Immediate alarm', 'IA', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_28_X_N_5_28_X_N', ''),
('2023-04-20 08:38:56', '423_D_73', '423_D_73', 'VCC - Overload Protection', 'S_ca1', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_73_X_N_5_73_X_N', ''),
('2023-04-20 08:38:56', '284_D_79', '284_D_79', 'Manual mode active', 'Man', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_79_X_N_5_79_X_N', ''),
('2023-04-20 08:38:56', '325_D_3', '325_D_3', 'Door open alarm', 'dor', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_3_X_N_5_3_X_N', ''),
('2023-04-20 08:38:56', '219_D_30', '219_D_30', 'Warning for timeout of defrost 2', 'Ed2', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_30_X_N_5_30_X_N', ''),
('2023-04-20 08:38:56', '218_D_29', '218_D_29', 'Warning for timeout of defrost 1', 'Ed1', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_29_X_N_5_29_X_N', ''),
('2023-04-20 08:38:56', '223_D_10', '223_D_10', 'Compressor offline', 'COM', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_10_X_N_5_10_X_N', ''),
('2023-04-20 08:38:56', '284_D_24', '284_D_24', 'Clock error', 'Etc', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_24_X_N_5_24_X_N', ''),
('2023-04-20 08:38:56', '222_D_26', '222_D_26', 'VCC malfunction', 'UCF', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_26_X_N_5_26_X_N', ''),
('2023-04-20 08:38:56', '155_D_13', '155_D_13', 'Low temperature alarm', 'LO', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_13_X_N_5_13_X_N', ''),
('2023-04-20 08:38:56', '156_D_12', '156_D_12', 'Low pressure alarm', 'LP', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_12_X_N_5_12_X_N', ''),
('2023-04-20 08:38:56', '216_D_5', '216_D_5', 'Generic function 1 high difference alarm', 'GHI', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_5_X_N_5_5_X_N', ''),
('2023-04-20 08:38:56', '264_D_14', '264_D_14', 'Maintenance request', 'SrC', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_14_X_N_5_14_X_N', ''),
('2023-04-20 08:38:56', '515_D_0', '515_D_0', 'OFFLINE', 'OFFLINE', 'Digital IO', 'boolean', '', '', 'r', '', '', '', '', '', '', '', '', '', '2_0_X_N_5_0_X_N', ''),
('2023-04-20 08:38:56', '219_D_11', '219_D_11', 'I/O configuration alarm', 'IOC', 'Digital IO', 'boolean', '', '', 'r', '', '', '0', '1', '', '', '', '', '', '2_11_X_N_5_11_X_N', '');







DROP TABLE IF EXISTS `iw_par_ca_ijfsmall_groups`;
CREATE TABLE IF NOT EXISTS `iw_par_ca_ijfsmall_groups` (
  `row_date` datetime NOT NULL DEFAULT '2017-01-01 00:00:00',
  `type` varchar(50) NOT NULL DEFAULT '',
  `view_order` mediumint(6) NOT NULL DEFAULT 0,
  `ref` varchar(100) NOT NULL DEFAULT '',
  `value` varchar(200) NOT NULL DEFAULT '',
  UNIQUE KEY `type` (`type`,`view_order`,`ref`,`value`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='4.0.0';

REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '93', '1', '243_D_37');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '35', '16', '164_A_42');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '92', '1', '242_D_44');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '307', '17', '529_I_15');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '35', '16', '166_A_76');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '4', '226_D_15');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '40', '16', '303_A_54');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '40', '0', '303_A_54');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '43', '16', '300_A_53');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '71', '2', '279_D_12');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '71', '0', '279_D_12');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '315', '17', '413_I_19');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '34', '263_D_13');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '99', '1', '254_D_38');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '3', '113_A_35');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '102', '1', '259_D_47');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '8', '114_D_21');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '1', '352_A_21');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '4', '251_D_16');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '316', '17', '521_I_20');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '3', '137_A_36');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '3', '141_A_37');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '81', '1', '253_I_30');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '31', '16', '214_A_46');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '31', '0', '214_A_46');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '32', '16', '224_A_44');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '33', '16', '228_A_45');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '75', '2', '262_D_18');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '75', '0', '262_D_18');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '337', '17', '535_I_33');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '310', '17', '412_I_16');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '44', '16', '306_D_17');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '70', '36', '148_I_7');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '7', '1', '148_A_19');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '20', '1', '279_A_29');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '10', '1', '317_A_26');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '51', '1', '284_D_70');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '51', '0', '284_D_70');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '76', '36', '154_I_49');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '80', '36', '156_I_0');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '58', '16', '237_A_71');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '57', '16', '236_A_70');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '60', '16', '239_A_73');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '59', '16', '238_A_72');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '62', '16', '241_A_75');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '312', '17', '530_I_18');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '61', '16', '240_A_74');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '71', '36', '173_I_1');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '2', '249_D_20');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '8', '1', '182_A_22');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '1', '183_A_23');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '0', '183_A_23');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '41', '16', '318_A_51');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '41', '0', '318_A_51');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '9', '1', '267_A_25');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '79', '36', '200_I_40');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '30', '16', '199_A_47');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '30', '0', '199_A_47');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '5', '1', '192_A_17');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '5', '0', '192_A_17');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '1', '197_A_18');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '0', '197_A_18');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '18', '1', '264_A_6');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '18', '0', '264_A_6');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '1', '201_A_8');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '327', '17', '533_I_27');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '325', '17', '415_I_25');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '151', '1', '422_I_79');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '53', '1', '218_D_63');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '56', '1', '221_D_54');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '51', '1', '220_D_53');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '52', '1', '222_D_59');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '52', '0', '222_D_59');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '1', '302_A_20');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '64', '1', '229_D_58');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '302', '17', '528_I_12');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '154', '1', '531_I_81');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '336', '17', '525_I_32');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '5', '118_I_60');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '55', '1', '247_D_48');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '59', '1', '255_D_56');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '11', '1', '272_A_27');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '11', '0', '272_A_27');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '311', '17', '520_I_17');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '57', '1', '256_D_51');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '58', '1', '259_D_64');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '65', '1', '262_D_65');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '61', '1', '265_D_52');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '66', '1', '264_D_60');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '67', '1', '267_D_66');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '320', '17', '414_I_22');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '60', '1', '266_D_62');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '54', '1', '248_D_49');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '54', '0', '248_D_49');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '68', '1', '269_D_61');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '62', '1', '268_D_57');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '69', '1', '271_D_55');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '63', '1', '270_D_50');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '5', '170_I_41');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '30', '1', '200_A_11');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '34', '1', '205_A_13');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '33', '1', '204_A_10');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '332', '17', '534_I_30');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '35', '1', '206_A_9');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '200', '4', '128_I_61');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '8', '202_A_85');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '9', '148_I_38');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '301', '17', '518_I_11');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '32', '1', '235_A_12');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '31', '1', '234_A_14');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '103', '157_I_50');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '335', '17', '417_I_31');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '72', '2', '244_D_2');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '72', '0', '244_D_2');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '201', '4', '170_D_1');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '499', '1', '365_I_31');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '322', '17', '532_I_24');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '4', '156_I_63');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '74', '36', '229_I_2');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '75', '36', '230_I_4');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '150', '1', '544_I_78');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '331', '17', '524_I_29');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '330', '17', '416_I_28');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '306', '17', '519_I_14');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '153', '1', '648_I_80');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '510', '1', '603_I_15');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '500', '1', '692_I_0');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '8', '206_A_84');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '83', '36', '197_I_6');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '321', '17', '522_I_23');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '84', '36', '198_A_8');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '85', '36', '203_I_56');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '305', '17', '411_I_13');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '42', '16', '296_A_52');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '2', '248_D_3');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '72', '36', '265_A_3');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '93', '36', '199_I_9');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '92', '36', '198_I_57');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '73', '36', '266_A_5');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '94', '36', '200_A_39');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '30', '1', '255_I_32');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '1', '268_A_7');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '0', '268_A_7');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '4', '249_D_19');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '1', '277_A_28');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '103', '260_A_55');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '51', '16', '231_A_64');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '317', '17', '531_I_21');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '53', '16', '233_A_66');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '152', '1', '416_I_77');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '52', '16', '232_A_65');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '55', '16', '235_A_68');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '54', '16', '234_A_67');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '56', '16', '236_A_69');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '300', '17', '410_I_10');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '50', '16', '619_I_62');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '97', '1', '215_D_39');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '6', '100_D_11');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '6', '101_D_14');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '34', '229_I_58');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '326', '17', '523_I_26');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '98', '1', '228_D_36');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '34', '16', '163_A_43');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '90', '1', '208_D_35');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '6', '1', '233_A_24');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '95', '1', '213_D_46');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '94', '1', '212_D_42');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '96', '1', '214_D_40');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '100', '1', '223_D_43');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '101', '1', '226_D_45');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '91', '1', '241_D_41');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '73', '2', '296_D_10');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '73', '0', '296_D_10');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '50', '1', '214_D_67');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '50', '0', '214_D_67');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '20', '1', '234_I_16');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '21', '1', '315_I_33');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '70', '2', '189_D_0');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '70', '0', '189_D_0');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'default_link', '0', '', '');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '1', '1', 'General');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '16', '16', 'Regulation parameters');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '17', '17', 'RTC parameters');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '4', '4', 'Configuration parameters');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '0', '0', 'Main status');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '2', '2', 'Commands');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '34', '34', 'Counters');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '3', '3', 'Alarm and digital inputs configuration');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '8', '8', 'Alarms');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '36', '36', 'Defrost parameters');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '5', '5', 'Fan parameters');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '9', '9', 'Outputs');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '103', '103', 'Humidifier');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '6', '6', 'Probe parameters');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '214_D_33');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '226_D_6');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '46', '183_D_22');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '43', '180_D_15');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '49', '267_D_23');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '40', '165_D_27');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '43', '264_D_16');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '55', '136_D_31');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '55', '221_D_69');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '224_D_68');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '118_D_17');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '119_D_18');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '120_D_19');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '121_D_20');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '122_D_21');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '123_D_80');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '39', '124_D_81');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '48', '255_D_2');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '48', '319_D_34');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '39', '249_D_4');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '41', '137_D_7');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '41', '142_D_8');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '46', '145_D_9');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '430_D_71');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '431_D_72');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '428_D_77');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '429_D_78');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '426_D_75');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '427_D_76');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '424_D_74');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '40', '138_D_28');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '423_D_73');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '39', '284_D_79');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '55', '325_D_3');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '44', '219_D_30');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '44', '218_D_29');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '43', '223_D_10');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '55', '284_D_24');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '43', '222_D_26');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '46', '155_D_13');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '2', '45', '156_D_12');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '39', '216_D_5');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '4', '51', '264_D_14');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '1', '47', '515_D_0');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group', '3', '55', '219_D_11');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '39', '39', 'Temperature setting alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '46', '46', 'Temperature alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '43', '43', 'Compressor alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '49', '49', 'Circuit alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '40', '40', 'Outside alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '55', '55', 'Other');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '48', '48', 'Fan alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '41', '41', 'HACCP alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '44', '44', 'Defrost alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '45', '45', 'Pressure alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '51', '51', 'Maintenance alarm');
REPLACE INTO `iw_par_ca_ijfsmall_groups` VALUES (NOW(), 'group_alias', '47', '47', 'Connection alarm');




DROP TABLE IF EXISTS `iw_set_ca_ijfsmall`;
CREATE TABLE IF NOT EXISTS `iw_set_ca_ijfsmall` (
  `row_date` datetime NOT NULL DEFAULT '2017-01-01 00:00:00',
  `element_id` varchar(100) NOT NULL DEFAULT '',
  `active` enum('0','1') NOT NULL DEFAULT '0',
  `onl_ind` enum('0','1') NOT NULL DEFAULT '1',
  `update_freq` set('','fast','norm','slow','once','never') NOT NULL DEFAULT 'norm',
  `save_data` varchar(20) NOT NULL DEFAULT 'change',
  `save_freq` varchar(20) NOT NULL DEFAULT '',
  `plant_pri` char(1) NOT NULL DEFAULT '',
  `sys_pri` char(1) NOT NULL DEFAULT '',
  `alarm_type` tinyint(3) NOT NULL DEFAULT 0,
  PRIMARY KEY (`element_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='4.0.0';

REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '243_D_37', '1', '1', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '164_A_42', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '242_D_44', '1', '1', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '529_I_15', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '166_A_76', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '226_D_15', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '303_A_54', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '300_A_53', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '279_D_12', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '413_I_19', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '263_D_13', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '254_D_38', '1', '1', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '113_A_35', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '259_D_47', '1', '1', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '114_D_21', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '352_A_21', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '251_D_16', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '521_I_20', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '137_A_36', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '141_A_37', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '253_I_30', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '214_A_46', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '224_A_44', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '228_A_45', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '262_D_18', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '535_I_33', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '412_I_16', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '306_D_17', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '148_I_7', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '148_A_19', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '279_A_29', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '317_A_26', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '284_D_70', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '154_I_49', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '156_I_0', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '237_A_71', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '236_A_70', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '239_A_73', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '238_A_72', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '241_A_75', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '530_I_18', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '240_A_74', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '173_I_1', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '249_D_20', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '182_A_22', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '183_A_23', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '318_A_51', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '267_A_25', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '200_I_40', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '199_A_47', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '192_A_17', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '197_A_18', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '264_A_6', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '201_A_8', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '533_I_27', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '415_I_25', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '422_I_79', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '218_D_63', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '221_D_54', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '220_D_53', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '222_D_59', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '302_A_20', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '229_D_58', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '528_I_12', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '531_I_81', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '525_I_32', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '118_I_60', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '247_D_48', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '255_D_56', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '272_A_27', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '520_I_17', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '256_D_51', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '259_D_64', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '262_D_65', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '265_D_52', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '264_D_60', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '267_D_66', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '414_I_22', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '266_D_62', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '248_D_49', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '269_D_61', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '268_D_57', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '271_D_55', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '270_D_50', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '170_I_41', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '200_A_11', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '205_A_13', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '204_A_10', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '534_I_30', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '206_A_9', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '128_I_61', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '202_A_85', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '148_I_38', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '518_I_11', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '235_A_12', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '234_A_14', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '157_I_50', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '417_I_31', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '244_D_2', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '170_D_1', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '365_I_31', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '532_I_24', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '156_I_63', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '229_I_2', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '230_I_4', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '544_I_78', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '524_I_29', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '416_I_28', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '519_I_14', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '648_I_80', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '603_I_15', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '692_I_0', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '206_A_84', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '197_I_6', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '522_I_23', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '198_A_8', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '203_I_56', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '411_I_13', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '296_A_52', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '248_D_3', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '265_A_3', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '199_I_9', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '198_I_57', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '266_A_5', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '200_A_39', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '255_I_32', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '268_A_7', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '249_D_19', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '277_A_28', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '260_A_55', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '231_A_64', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '531_I_21', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '233_A_66', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '416_I_77', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '232_A_65', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '235_A_68', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '234_A_67', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '236_A_69', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '410_I_10', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '619_I_62', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '215_D_39', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '100_D_11', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '101_D_14', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '229_I_58', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '523_I_26', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '228_D_36', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '163_A_43', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '208_D_35', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '233_A_24', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '213_D_46', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '212_D_42', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '214_D_40', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '223_D_43', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '226_D_45', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '241_D_41', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '296_D_10', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '214_D_67', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '234_I_16', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '315_I_33', '1', '0', 'norm', 'change', '', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '189_D_0', '1', '0', 'slow', 'min', '1', '', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '214_D_33', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '226_D_6', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '183_D_22', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '180_D_15', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '267_D_23', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '165_D_27', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '264_D_16', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '136_D_31', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '221_D_69', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '224_D_68', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '118_D_17', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '119_D_18', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '120_D_19', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '121_D_20', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '122_D_21', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '123_D_80', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '124_D_81', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '255_D_2', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '319_D_34', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '249_D_4', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '137_D_7', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '142_D_8', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '145_D_9', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '430_D_71', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '431_D_72', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '428_D_77', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '429_D_78', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '426_D_75', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '427_D_76', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '424_D_74', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '138_D_28', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '423_D_73', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '284_D_79', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '325_D_3', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '219_D_30', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '218_D_29', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '223_D_10', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '284_D_24', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '222_D_26', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '155_D_13', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '156_D_12', '1', '0', 'norm', 'change', '', 'A', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '216_D_5', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '264_D_14', '1', '0', 'norm', 'change', '', 'B', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '515_D_0', '1', '0', 'norm', 'change', '', 'N', '', '0');
REPLACE INTO `iw_set_ca_ijfsmall` VALUES (NOW(), '219_D_11', '1', '0', 'norm', 'change', '', 'B', '', '0');


