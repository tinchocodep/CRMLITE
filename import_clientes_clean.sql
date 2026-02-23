-- Clientes Soldo Hue (tenant 3)
INSERT INTO companies (legal_name, cuit, phone, email, company_type, label, tenant_id, comercial_id)
SELECT
  tc.legal_name,
  NULLIF(tc.cuit,''),
  NULLIF(tc.telefono,''),
  NULLIF(LOWER(tc.email),''),
  'empresa' AS company_type,
  'client' AS label,
  3 AS tenant_id,
  c.id AS comercial_id
FROM (VALUES
  ('BERMEJO, JUAN MANUEL','AGRICOLA ANDIFE SRL / ALEJANDRO ROMEO','30715562673','2342401835','administracion@soldohue.com.ar'),
  ('BERMEJO, JUAN MANUEL','BECARIA JORGE A. Y BRUININ MARIA G.','30654727380','2342412167','mgbruinin@hotmail.com'),
  ('BERMEJO, JUAN MANUEL','BERGAMINI ALDO RUBEN','20132998206','2346412301','bergamini.aldo.2016@gmail.com'),
  ('BERMEJO, JUAN MANUEL','BLANCO MIGUEL ANGEL','20108500302','','administracion@soldohue.com.ar'),
  ('BERMEJO, JUAN MANUEL','Lopez Mazzini','0','VENDIDO 12 BLS DE 1153 IG','-'),
  ('BERMEJO, JUAN MANUEL','MAZZINI MARIO MARTIN','20312314178','','mariomartin2@hotmail.com'),
  ('BERMEJO, JUAN MANUEL','Mosca Javier Gustavo','23225683719','','javiermosca40@gmail.com'),
  ('Galindez, Santiago','PAGANI GRACIELA NOEMI','','',''),
  ('Galindez, Santiago','San Jose de la Colina','','',''),
  ('jose','CECOTTI FERNANDO JORGE','20362592950','',''),
  ('JUAN LOPEZ','AGROALMERIA','30708522275','3462-567929',''),
  ('JUAN LOPEZ','Alfonso Osvaldo','33710355989','2314-622233',''),
  ('JUAN LOPEZ','Algarra Gaston','30654965273','2314-500901',''),
  ('JUAN LOPEZ','Azcarete Aldo','30707584579','249-4643452',''),
  ('JUAN LOPEZ','Ballestero Martin','20239342982','2314-535688',''),
  ('JUAN LOPEZ','Borghi Adolfo','20129235005','2314-533539',''),
  ('JUAN LOPEZ','Braida Agustin','30608522898','2314-416184',''),
  ('JUAN LOPEZ','Bustingorri Goncho','0','2344-443356',''),
  ('JUAN LOPEZ','Calvo Mauricio','0','2314-409142',''),
  ('JUAN LOPEZ','Canepa Ignacio','0','11-5408-0171',''),
  ('JUAN LOPEZ','Capelle Juan Martin','0','11-6024-0529',''),
  ('JUAN LOPEZ','Caruzo Enzo','0','11-5006-9535',''),
  ('JUAN LOPEZ','Castelani Osvaldo','0','2314-579707',''),
  ('JUAN LOPEZ','Celerino Jeronimo','30718794486','2342-407834',''),
  ('JUAN LOPEZ','Coll Irene','30638085794','2396-614685',''),
  ('JUAN LOPEZ','Maria teresa','30667339665','2392-510873',''),
  ('JUAN LOPEZ','Cosentino Gustavo y Santoro Julio','27116137262','11-3088-1041',''),
  ('JUAN LOPEZ','Durrieu Dolores','30624322637','11-6661-3953',''),
  ('JUAN LOPEZ','Eduardo Gallo Llorente','33715206809','11-5021-7796',''),
  ('JUAN LOPEZ','El pecan','0','2314-441015',''),
  ('JUAN LOPEZ','Fernandez Guillermo','30614002588','2314-401127',''),
  ('JUAN LOPEZ','Francisqueli Dario','20266430168','2314-628017',''),
  ('JUAN LOPEZ','Goldscheidt Juan','0','11-5007-3353',''),
  ('JUAN LOPEZ','Gutierrez Francisco','30717567427','2314-448136',''),
  ('JUAN LOPEZ','Gutierrez Manuel','0','2314-401805',''),
  ('JUAN LOPEZ','Hollman santiago','30522159979','2396-548269',''),
  ('JUAN LOPEZ','Iturriaga Ignacio','30519036629','2314-530741',''),
  ('JUAN LOPEZ','La solita','0','11-5656-0878',''),
  ('JUAN LOPEZ','Lagreca Anibal','0','2314-627043',''),
  ('JUAN LOPEZ','LEGNANI JULIO. Miguel Carmelo','20334797431','',''),
  ('JUAN LOPEZ','PAPA Y CHICOS','0','2392-536915',''),
  ('JUAN LOPEZ','LA ESPERANZA','0','2314-621193',''),
  ('JUAN LOPEZ','Mendia Alejandro','0','2284-587883',''),
  ('JUAN LOPEZ','Monasterio Ruben','0','2392-489219',''),
  ('JUAN LOPEZ','Ocampo Rafael','30601297074','(310) 292-4783',''),
  ('JUAN LOPEZ','EL broquel','30707192581','2396-440680',''),
  ('JUAN LOPEZ','PALADINO SEBASTIAN','30710229542','',''),
  ('JUAN LOPEZ','Peierguidi Juan','20111123943','2314-625137',''),
  ('JUAN LOPEZ','Pereyra Iraola Ignacio Coco','30717237052','11-65597186',''),
  ('JUAN LOPEZ','Preisegger Juan','23170966619','2284-217257',''),
  ('JUAN LOPEZ','Pulgari Marcelo','30532275357','11-6600-7171',''),
  ('JUAN LOPEZ','Ima sumac','30708075392','2314-514780',''),
  ('JUAN LOPEZ','Sanchez German','30610312949','2314-620606',''),
  ('JUAN LOPEZ','Sanchez Lama Ricardo','20121846757','11-5739-9647',''),
  ('JUAN LOPEZ','Santamaria Matias','0','2314-408905',''),
  ('JUAN LOPEZ','Santoro Julio','0','11-5457-8666',''),
  ('JUAN LOPEZ','Sarciat Martin','0','2396-634571',''),
  ('JUAN LOPEZ','Stefoni Marcelo','30682653406','11-3781-7964',''),
  ('JUAN LOPEZ','Valerga Hector.','0','2314-620105',''),
  ('JUAN LOPEZ','Vicente Santiago','33711754909','2314-476631',''),
  ('JUAN LOPEZ','Zabala Jose Luis','30715353225','2395-407244',''),
  ('LUIS SERAN','GROSSI ERNESTO RICARDO','23050661849','',''),
  ('MIA VICENTE','PAGANI GRACIELA NOEMI','','',''),
  ('MIA VICENTE','TISCORNIA GUILLERMO PEDRO','','',''),
  ('MIA VICENTE','TISCORNIA GUILLERMO PEDRO','','',''),
  ('SANTIAGO GALINDEZ','FMT Lacteos SA','30709878421','249-446-9404',''),
  ('SANTIAGO GALINDEZ','Lena SCA','30561787243','2396-519372',''),
  ('SANTIAGO GALINDEZ','Delfinagro SA','30582522177','2923-563436',''),
  ('SANTIAGO GALINDEZ','Rangi Agropecuaria','0','11-5463-5782',''),
  ('SANTIAGO GALINDEZ','Ronzitti Ruben Genaro','20050654304','2396-448023',''),
  ('SOLER, CARLOS','4 leguas','0','11-5001-3819',''),
  ('SOLER, CARLOS','ABETEC SOCIEDAD ANONIMA','30707882243','2346682454',''),
  ('SOLER, CARLOS','AGRAR AGRICOLA ARGENTINA S A','30594231119','','"csoler@soldohue.com.ar'),
  ('SOLER, CARLOS','ALFARO EDUARDO FEDERICO','20082505297','','federicoalfaro20@yahoo.com.ar'),
  ('SOLER, CARLOS','ARANA RAUL ALBERTO','20140855309','2923445394',''),
  ('SOLER, CARLOS','WILSON JORGE','0','2346682454',''),
  ('SOLER, CARLOS','AVILEZ MARIANO / AVILES RAUL','0','2358405185',''),
  ('SOLER, CARLOS','BAGATTIN MAURICIO LUCAS','20286018875','2342401274','mlbagattin@gmail.com'),
  ('SOLER, CARLOS','BAUSCHEN BERNARDO','20280996271','2346569272','bbauschen@hotmail.com'),
  ('SOLER, CARLOS','CHIARA GERARDO','20145933456','2346655522','administracion@soldohue.com.ar'),
  ('SOLER, CARLOS','Di Carlo Miguel Angel','20049775041','','-'),
  ('SOLER, CARLOS','FULL AGRO S.A.','30708925167','','lseran@full-agro.com.ar / mleunda@full-agro.com.ar / nfll@speedy.com.ar / franccalvo@gmail.com'),
  ('SOLER, CARLOS','HUGO COLOMBO SA','30711917744','234251222','hcolombo@crebragado.com.ar'),
  ('SOLER, CARLOS','JOSE RICARDO KLIN','0','2364419231',''),
  ('SOLER, CARLOS','MOLEA JORGE Y RAUL','0','2364659343',''),
  ('SOLER, CARLOS','NATERO CINTIA VANESA','27306282323','02364-585427',''),
  ('SOLER, CARLOS','San Jose de la Colina','','',''),
) AS tc(comercial_nombre, legal_name, cuit, telefono, email)
LEFT JOIN comerciales c ON UPPER(c.name) = UPPER(tc.comercial_nombre) AND c.tenant_id = 3
ON CONFLICT DO NOTHING;

