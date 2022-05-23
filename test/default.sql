CREATE TABLE `income_expenditure_detail` (
 `id` INTEGER NOT NULL ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `type` int NOT NULL  ,
 `desc` varchar(64) NULL  ,
 `money` INTEGER NOT NULL  ,
 `happen_time` datetime NOT NULL  ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);

CREATE TABLE `investment_detail` (
 `id` INTEGER NOT NULL  ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `product_id` INTEGER NOT NULL  ,
 `product_name` varchar(64) NOT NULL  ,
 `money` INTEGER NOT NULL  ,
 `happen_time` datetime NOT NULL  ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);


CREATE TABLE `investment_product` (
 `id` INTEGER NOT NULL  ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `name` varchar(64) NOT NULL  ,
 `type` int NOT NULL  ,
 `desc` varchar(64) NULL  ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);


CREATE TABLE `investment_product_real` (
 `id` INTEGER NOT NULL  ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `product_id` INTEGER NOT NULL  ,
 `product_name` INTEGER NOT NULL  ,
 `money` INTEGER NOT NULL  ,
 `happen_time` datetime NOT NULL  ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);


CREATE TABLE `investment_profit` (
 `id` INTEGER NOT NULL  ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `product_id` INTEGER NOT NULL  ,
 `product_name` INTEGER NOT NULL  ,
 `money` INTEGER NOT NULL  ,
 `happen_time` datetime NOT NULL  ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);


CREATE TABLE `asset_summary` (
 `id` INTEGER NOT NULL  ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `money` INTEGER NOT NULL  ,
 `happen_time` datetime NOT NULL  ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);

INSERT INTO investment_product (gmt_create, gmt_modified, name, type) values (1, 2, 3, 4, 5);