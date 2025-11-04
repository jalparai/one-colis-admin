"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function CityTable() {
  const { t, i18n } = useTranslation("common");
  const isArabic = i18n.language === "ar";

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cityData = useMemo(
    () => [
      { city: t("El_Helhal"), book: "30.00 Dh", back: "0.00 Dh" },
      { city: t("ERRAHMA_CITY"), book: "30.00 Dh", back: "0.00 Dh" },
      { city: t("Ain_Harrouda"), book: "30.00 Dh", back: "0.00 Dh" },
      { city: t("Tit_mellil"), book: "30.00 Dh", back: "0.00 Dh" },
      { city: t("Ait_Melloul"), book: "35.00 Dh", back: "0.00 Dh" },
      { city: t("Agadir"), book: "35.00 Dh", back: "0.00 Dh" }, 
      { city: t("Deroua_Oulad_Ziane"), book: "35.00 Dh", back: "0.00 Dh" }, 
      { city: t("DAR_BOUAZZA"), book: "35.00 Dh", back: "0.00 Dh" },
       { city: t("Tetouan"), book: "35.00 Dh", back: "0.00 Dh" }, 
       { city: t("El_Jadida"), book: "35.00 Dh", back: "0.00 Dh" }, { city: t("Dar_16"), book: "35.00 Dh", back: "0.00 Dh" }, { city: t("Inezgane"), book: "35.00 Dh", back: "0.00 Dh" }, { city: t("El_Gara"), book: "35.00 Dh", back: "0.00 Dh" }, { city: t("Meknes"), book: "35.00 Dh", back: "0.00 Dh" }, { city: t("Berrechid"), book: "35.00 Dh", back: "0.00 Dh" }, { city: t("Mohammadia"), book: "35.00 Dh", back: "0.00 Dh" }, 
     
      { city: t("Foum_El_Oued"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("El_Ouatia"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("bni_hdifa"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("mhaya"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Ribat_el_Kheir"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("To_smile"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("tasltanet"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Jorf_el_melha"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Ajdir_el_hociema"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("masmouda"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Beni_Bouayach"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("triq_fes_marrakech"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Driouch"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Sidi_Bennour"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Azla"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Ben_Ahmed"), book: "45.00 Dh", back: "0.00 Dh" }, { city: t("Moulay_Bousselham"), book: "45.00 Dh", back: "0.00 Dh" },
     
     
       { city: t("Mdiq"), book: "45.00 Dh", back: "0.00 Dh" }
   
   ,
  { city: t("Tangier"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Kenitra"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Dirty"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Temara"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("TAMARIS"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("FES"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Beni_Mellal"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Rabat"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Marrakech"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Sala_Al_Jadida"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Khouribga"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Ben_Yakhlef"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("BOUSKOURA"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Nouaceur"), book: "35.00 Dh", back: "0.00 Dh" },
  { city: t("Moulay_Abdellah"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Temsia"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Sefrou"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Tiznit"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Safi"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Benslimane"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Saidia"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Ouislane"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Bouznika"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Ain_El_Aouda"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Bouknadel"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Chefchaouen"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Tamesna"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Skhirat"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Taroudant"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("El_Mansouria"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Nador"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Bni_Drar"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Zagora"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("cup"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Azemmour"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Larache"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Bouzid"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Had_Soualem"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Martil"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Mediouna"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Ouazzane"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Hajjaj_Oued_Hassar"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Settat"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("OUJDA"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Ain_Atiq"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("AZROU"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("CHELLALAT_MOHAMMEDIA"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Rahal"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Berkane"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Tayeb"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("afaq"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Al_Hoceima"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Harhoura"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Essaouira"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("asni"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("Anza"), book: "40.00 Dh", back: "0.00 Dh" },
  { city: t("EL_Ayoun"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bir_Jdid"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Laagreb"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Asjanee"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Targuist"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Berhil"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Houara_Oulad_Rahho"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Issaguen"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Azrou_Agadir"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bni_Ansar"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Zmam"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oued_Laou"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ouarzazate"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Agdz"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Boufekrane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tleta_Loulad"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Hattane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Youssoufia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bni_Koula"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ait_Amira"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Bibi"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Belfaa"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Kamouni"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Mimoun_Agadir"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Karia_Ba_Mohammed"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Moulay_Brahim"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Zoumi"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tamelelt"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Imouzzer_Kandar"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sebt_El_Guerdane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Abrikcha"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tarfaya"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bouaboud"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("El_Kelaa_Des_Sraghna"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bounouar_Khouribgua"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Boujdour"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Jaadar"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Selouane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Lalla_Mimouna"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Fkih_Ben_Salah"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ain_Bida"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Msawar_Rasso"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Alal_Tazi"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tnine_Chtouka"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Abed"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Douar_Takni"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ksar_El_Kebir"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ksar_Es_Seghir"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bab_Taza"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sebt_Mzouda"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Moumna"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Maaziz"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Errachidia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tamansourt"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("El_Hadj_Kaddour"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ain_Lmdiwr"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Imouzzer_Marmoucha"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Boulemane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Missouri"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Boumia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Er_Rich"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Taounate"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Harazem"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Khemis_Sahel"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Amsa"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Azilal"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tighessaline"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Skoura_Ouarzazate"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Boumalne_Dades"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Douiyat"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("El_Hajeb"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tinejdad"), book: "45.00 Dh", back: "0"},
  { city: t("Oulmes"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Sebt_Gzoula"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Jamaat_Shaim"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ighoud"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Tleta_Sidi_Bouguedra"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Tameslouhte"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Sidi_Mokhtar"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ain_Chqef"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Drarga_Agadir"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ain_Cheggag"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Bhalil"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Merzouga"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Boudnib"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Goulmima"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Rissani"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ain_Allah"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ouled_Amrane"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Midar"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Khenifra"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Jorf_Lasfar"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Tinghir"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("El_Kelaa_Mgouna"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Imzouren"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Sidi_Ifni"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Bouizakarne"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Oulad_Teima"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Tan_Tan"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Assa"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Bejaad"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Midelt"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Moulay_Driss_Zerhoun"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Sidi_Allal_El_Bahraoui"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ait_Ourir"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ben_Guerir"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Laayoune"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ajdir"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Dakhla"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Bouarfa"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Taourirt"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Zaoui_Sidi_Ismail"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Souk_Larebaa_Lghareb"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ouled_Frej"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Ifrane"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Oued_Zem"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Aoulouz"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Tamazouzte"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Sidi_Chiker"), book: "45.00 Dh", back: "0.00 Dh" },
{ city: t("Imintanoute"), book: "45.00 Dh", back: "0.00 Dh" },


  { city: t("Tiflet"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Assa_zag"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Guelmim"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Amzafroune"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Taibi"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Slimane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Khenichet"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Kacem"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bouyafar"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Madagh"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Figuig"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tiztoutine"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Zeghanghane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Aklim"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Fnideq"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Ayad"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Yahya_El_Gharb"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Haouzia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ghadban"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Khemis_of_the_Zemamra"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Taznakht"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("El_Ksiba"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tanougha"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Aisa"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Kraza"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("El_Kbab"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Souk_Sebt_Oulad_Nemma"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ahfir"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ben_Taib"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Farkhana"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Guercif"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Zaio"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Dar_Kebdani"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Beni_Chiker"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ras_El_Ma"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tendrara"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Kariat_Arkmane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bouarg"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ain_Bni_Mathar"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Jerada"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Al_Aaroui"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Feryata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Foum_Oudi"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Jaber"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Kasba_Tadla"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Had_Bradia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ouled_Youssef"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Aguelmouss_Khenifra"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ait_Tislit"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Zawiate_Aite_Ishak_Khenifra"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Adouz"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Amghila"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Zaouiat_Cheikh"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Mbarek"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ait_Ali"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Moussa"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ighram_Laalam"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Yaich"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Ismail"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Said_LOued"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Tagzirt"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Foum_Zaouia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ould_Zidouh"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ikhourba"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bni_Ayat"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Foum_El_Anser"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ouaouizeght"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Mrirt"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Afourar"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bin_El_Ouidane"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Foum_Jamaa"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bzou"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Beni_Hassan"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Amizmiz"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ounagha"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Birkouate"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tadart_Agadir"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Lqliaa"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Souihla"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Hanchan"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Tahla"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Kfifat"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Taghazout"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tamraght"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ayne_Baydae"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Talmest"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Skhour_Rehamna"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tidzi"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Belaagid"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Smimou"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Boukidan"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tuzdi"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tamanar"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Lalla_Takerkoust"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Mzoudia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ait_Kamra"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Demnate"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Bou_Othmane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("El_Jorf_Errachidia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tata"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Laayoune_Charkia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Mazagan_Beach"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oualidia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("El_Borouj"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Guisser"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Khemisset"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ghafsai"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Radouane"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Laayoune_Port"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ben_Rahmoun"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Douar_Sultan"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Almatar"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Agourai"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ain_Jemaa"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Dcheira"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Biougra"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ourika_Marakkech"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Outat_El_Haj"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Abdallah_Ghiat"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Fall"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Essemara"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oulad_Yahya"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Moukrissate"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bni_Bouayach"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Sidi_Kaouki"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tiddas"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Chemaia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Mejjat"), book: "45.00 Dh", back: "0.00 Dh" },

  
  { city: t("Tafraoute"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tahnaout"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Laattaouia"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Samara"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Aguidir"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Mechra_Bel_Ksiri"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Arbaa_El_Aounate"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Loudaya"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ait_Hadi"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Boujniba_Khouribga"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Zaida"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ain_Taoujdate"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Moulay_Yacoub"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Boujniba"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("El_Menzel"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Rommani"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Souk_El_Had_Oulad_Dahou"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Arfoud"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Bab_Bared"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Cabo_Negro"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Akka_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Foum_El_Hisn_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Foum_Zguid_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Addis_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("AkkaEghan_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ait_Ouabelli_Tata"), book: "45.00 Dh", back: "0.00 Dh" },

  { city: t("Agadir_Lhénna_Tata"), book: "45.00 Dh", back: "0.00 Dh" },


  { city: t("Elougoum_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Ben_Yaacoub_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Issafen_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Kasbah_Sidi_Abdallah_Ben_Mbarek_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Oum_El_Guerdane_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tagmout_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tamanart_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tighzmerte_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tissint_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tizgui_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Tizounine_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Atlite_Tata"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Igherm_Taroudant"), book: "45.00 Dh", back: "0.00 Dh" },
  { city: t("Source"), book: "50.00 Dh", back: "0.00 Dh" }
   
    ],
    [t]
  );

  const filteredCities = useMemo(
    () =>
      cityData.filter(({ city }) =>
        city.toLowerCase().includes(search.toLowerCase())
      ),
    [search, cityData]
  );

  const totalPages = Math.ceil(filteredCities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCities = filteredCities.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

const paginationButtons = () => {
  const pages = [];
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const maxPagesToShow = isMobile ? 3 : 5; // fewer pages on mobile

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  if (startPage > 1) pages.push(1, "...");
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < totalPages) pages.push("...", totalPages);

  return pages;
};


  return (
    <div
      className={`lg:w-[70%] mt-10 lg:p-6 p-4 bg-white rounded-sm shadow-md`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Search */}
      <input
        type="text"
        placeholder={t("cityTable.searchCity")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={t("cityTable.searchCity")}
      />

      {/* Table */}
      <table
        className={`w-full border-collapse ${isArabic ? "text-right" : "text-left"
          }`}
      >
        <thead>
          <tr className="border-b text-gray-800 font-semibold">
            <th className="py-2">{t("cityTable.city")}</th>
            <th className="py-2">{t("cityTable.book")}</th>
            <th className="py-2">{t("cityTable.back")}</th>
          </tr>
        </thead>
        <tbody>
          {currentCities.length > 0 ? (
            currentCities.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50 border-b">
                <td className="py-2">{row.city}</td>
                <td className="py-2">{row.book}</td>
                <td className="py-2">{row.back}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center py-4 text-gray-500">
                {t("cityTable.noCities")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
   <div
  className={`flex flex-wrap justify-center items-center gap-2 mt-6
    ${isArabic ? "flex-row-reverse" : ""}`}
>
  {/* Previous */}
  <button
    onClick={() => goToPage(currentPage - 1)}
    disabled={currentPage === 1}
    className="px-2 sm:px-3 py-1 border rounded-md text-gray-800 border-blue-400 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {t("cityTable.previous")}
  </button>

  {/* Numbers */}
  {paginationButtons().map((num, idx) =>
    num === "..." ? (
      <span key={idx} className="px-2 sm:px-3 py-1 text-gray-500">
        ...
      </span>
    ) : (
      <button
        key={idx}
        onClick={() => goToPage(num)}
        className={`px-2 sm:px-3 py-1 rounded-md border transition 
          ${currentPage === num
            ? "bg-[#2BC3F1] text-white border-[#2BC3F1]"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
      >
        {num}
      </button>
    )
  )}

  {/* Next */}
  <button
    onClick={() => goToPage(currentPage + 1)}
    disabled={currentPage === totalPages}
    className="px-2 sm:px-3 py-1 border rounded-md text-[#2BC3F1] border-blue-400 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {t("cityTable.next")}
  </button>
</div>

    </div>
  );
}
