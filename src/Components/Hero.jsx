import React, { useState, useRef, useEffect } from "react";
import Doctor from "../assets/Doctor.png";
import "../Styles/Hero.css";
import { Input } from "@material-tailwind/react";
import { TbSearch } from "react-icons/tb";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchSuggestions from "./SearchSuggestions";
import Hospitals from "./Hospitals";

function Hero() {
  // --- 1) District & Disease data ---
  const districts = [
    "Angul",
    "Balangir",
    "Balasore",
    "Bargarh",
    "Bhadrak",
    "Boudh",
    "Cuttack",
    "Deogarh",
    "Dhenkanal",
    "Gajapati",
    "Ganjam",
    "Jagatsinghpur",
    "Jajpur",
    "Jharsuguda",
    "Kalahandi",
    "Kandhamal",
    "Kendrapada",
    "Keonjhar",
    "Khordha",
    "Koraput",
    "Malkangiri",
    "Mayurbhanj",
    "Nabarangpur",
    "Nayagarh",
    "Nuapada",
    "Puri",
    "Rayagada",
    "Sambalpur",
    "Subarnapur",
    "Sundargarh",
  ];

  const diseases = [
    "Diabetes",
    "Hypertension",
    "Asthma",
    "Tuberculosis",
    "Dengue",
    "Malaria",
    "Typhoid",
    "Cancer",
    "Heart Disease",
    "Stroke",
    "Arthritis",
    "Alzheimer's",
    "Parkinson's",
    "HIV/AIDS",
    "Hepatitis",
    "Pneumonia",
    "Influenza",
    "Migraine",
    "Epilepsy",
    "Obesity",
  ];

  // --- 2) Hard-coded Ganjam hospitals ---
  const ganjamHospitals = [
    {
      id: "1",
      Name: "IMS and SUM Hospital, Campus III",
      Website: "https://sum.soa.ac.in/berhampur",
      Rating: 3.3,
      Type: "Private Hospital",
      Contact: "6811275777",
      "Google Map Link": "https://maps.app.goo.gl/TRjtxxHoA6M9X68t7",
    },
    {
      id: "2",
      Name: "UHWC",
      Website: "",
      Rating: 3.5,
      Type: "Government hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/UHWC+kabisuraya+Nagar,+Ganjam/data=!4m7!3m6!1s0x3a22b3004be5398d:0x3db011af912c25fd!8m2!3d19.5820198!4d84.75767!16s%2Fg%2F11v_05_kym!19sChIJjTnlSwCzIjoR_SUska8RsD0?authuser=0&hl=en&rclk=1",
    },
    {
      id: "3",
      Name: "Subalaya ANM",
      Website: "",
      Rating: 5,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Subalaya+ANM+%28Hospital%29/data=!4m7!3m6!1s0x3a17f8498ba8fb83:0xb3d7c0aea1be4eaa!8m2!3d19.460859!4d85.084204!16s%2Fg%2F11f54lgs0c!19sChIJg_uoi0n4FzoRqk6-oa7A17M?authuser=0&hl=en&rclk=1",
    },
    {
      id: "4",
      Name: "New Nandighosh Hospital",
      Website: "",
      Rating: 3.4,
      Type: "Hospital",
      Contact: "093373 54507",
      "Google Map Link":
        "https://www.google.co.in/maps/place/New+Nandighosh+Hospital/data=!4m7!3m6!1s0x3a3d516840c34059:0xd5bfdb74d2159eec!8m2!3d19.3071923!4d84.8159682!16s%2Fg%2F11jtgjhmgj!19sChIJWUDDQGhRPToR7J4V0nTbv9U?authuser=0&hl=en&rclk=1",
    },
    {
      id: "5",
      Name: "Sun Healthcare Hospital",
      Website: "",
      Rating: 3.1,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Sun+Healthcare+Hospital/data=!4m7!3m6!1s0x3a3d5079afb822f9:0xc130bd479ec164bb!8m2!3d19.3081892!4d84.8065518!16s%2Fg%2F11by_fddmy!19sChIJ-SK4r3lQPToRu2TBnke9MME?authuser=0&hl=en&rclk=1",
    },
    {
      id: "6",
      Name: "Jagannath Hospital",
      Website: "",
      Rating: 3.4,
      Type: "Hospital",
      Contact: "089175 97397",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Jagannath+Hospital/data=!4m7!3m6!1s0x3a3d51dc03f03787:0x84558f6520cfa42d!8m2!3d19.3090064!4d84.8063756!16s%2Fg%2F11nxs_fznt!19sChIJhzfwA9xRPToRLaTPIGWPVYQ?authuser=0&hl=en&rclk=1",
    },
    {
      id: "7",
      Name: "Bansadhara Hospital",
      Website: "",
      Rating: 4.6,
      Type: "Hospital",
      Contact: "094370 70749",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Bansadhara+Hospital/data=!4m7!3m6!1s0x3a1a212daaaaaaab:0xdabd46931d4a4294!8m2!3d19.307595!4d84.8087068!16s%2Fg%2F1thx707r!19sChIJq6qqqi0hGjoRlEJKHZNGvdo?authuser=0&hl=en&rclk=1",
    },
    {
      id: "8",
      Name: "MKCG In-Patient Block",
      Website: "",
      Rating: 3.6,
      Type: "Government hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/MKCG+In-Patient+Block/data=!4m7!3m6!1s0x3a3d507dd28996a7:0x5de94a01397a83b9!8m2!3d19.3113218!4d84.8126329!16s%2Fg%2F1vq9kq2t!19sChIJp5aJ0n1QPToRuYN6OQFK6V0?authuser=0&hl=en&rclk=1",
    },
    {
      id: "9",
      Name: "Ruby Eye Hospital",
      Website: "http://www.rubyeyehospital.com/",
      Rating: 3.8,
      Type: "Hospital",
      Contact: "094390 73344",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Ruby+Eye+Hospital,+Govinda+Bihar,+Berhampur/data=!4m7!3m6!1s0x3a3d5065f66be85b:0x1322b8ce9ff2ba3f!8m2!3d19.3215071!4d84.8050464!16s%2Fg%2F11bc7t8326!19sChIJW-hr9mVQPToRP7ryn864IhM?authuser=0&hl=en&rclk=1",
    },
    {
      id: "10",
      Name: "Gurudev Hospital",
      Website: "",
      Rating: 2.9,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Gurudev+Hospital/data=!4m7!3m6!1s0x3a3d5079bd372db1:0x9d3dbbb062e701bf!8m2!3d19.3144536!4d84.8020152!16s%2Fg%2F11b6bdzwtr!19sChIJsS03vXlQPToRvwHnYrC7PZ0?authuser=0&hl=en&rclk=1",
    },
    {
      id: "11",
      Name: "ESI Dispensary",
      Website: "",
      Rating: 3.5,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/ESI+DISPENSARY+GANJAM/data=!4m7!3m6!1s0x3a17fd007d571ca7:0xc630dfad0e4c057a!8m2!3d19.3524456!4d84.9745925!16s%2Fg%2F11vt82f15g!19sChIJpxxXfQD9FzoRegVMDq3fMMY?authuser=0&hl=en&rclk=1",
    },
    {
      id: "12",
      Name: "Govt Hospital CHC-II",
      Website: "https://health.odisha.gov.in/",
      Rating: 3.6,
      Type: "Government hospital",
      Contact: "9090909090",
      "Google Map Link":
        "https://www.google.co.in/maps/place/GOVT+HOSPITAL+CHC-II+BUGUDA/data=!4m7!3m6!1s0x3a22a30cb0739cc7:0xf4bc25470250ea24!8m2!3d19.8139783!4d84.7917006!16s%2Fg%2F11fmywcqdk!19sChIJx5xzsAyjIjoRJOpQAkclvPQ?authuser=0&hl=en&rclk=1",
    },
    {
      id: "13",
      Name: "Meenakshi Hospital",
      Website: "",
      Rating: 4.2,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Meenakshi+Hospital/data=!4m7!3m6!1s0x3a3d500cefa0b67f:0xdf7fc51eb8f1958!8m2!3d19.3123381!4d84.7923826!16s%2Fg%2F1q640200k!19sChIJf7ag7wxQPToRWBmP61H89w0?authuser=0&hl=en&rclk=1",
    },
    {
      id: "14",
      Name: "Government Homeopathic Medical",
      Website: "",
      Rating: 5,
      Type: "Medical Center",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Government+Homeopathic+Medical,+Munigadi,+Ganjam+%28%E0%AC%B8%E0%AC%B0%E0%AC%95%E0%AC%BE%E0%AC%B0%E0%AD%80+%E0%AC%B9%E0%AD%8B%E0%AC%AE%E0%AC%BF%E0%AC%93%E0%AC%AA%E0%AC%BE%E0%AC%A5%E0%AC%BF%E0%AC%95%E0%AD%8D+%E0%AC%AE%E0%AD%87%E0%AC%A1%E0%AC%BF%E0%AC%95%E0%AC%BE%E0%AC%B2%E0%AD%8D,+%E0%AC%AE%E0%AD%81%E0%AC%A8%E0%AC%BF%E0%AC%97%E0%AC%BE%E0%AC%A1%E0%AC%BF%29+%7C/data=!4m7!3m6!1s0x3a22b961b391bb77:0xa79d52a66a67509c!8m2!3d19.7537583!4d84.6359602!16s%2Fg%2F11lkbd8zn8!19sChIJd7uRs2G5IjoRnFBnaqZSnac?authuser=0&hl=en&rclk=1",
    },
    {
      id: "15",
      Name: "Amit Hospital",
      Website: "",
      Rating: 3.6,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/AMIT+HOSPITAL/data=!4m7!3m6!1s0x3a3d500d41b6b4df:0x3ca004fd73a6026b!8m2!3d19.31487!4d84.7931815!16s%2Fg%2F1tq4pj3r!19sChIJ37S2QQ1QPToRawKmc_0EoDw?authuser=0&hl=en&rclk=1",
    },
    {
      id: "16",
      Name: "Gopalpur Government Hospital",
      Website: "",
      Rating: 3.8,
      Type: "Government hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Gopalpur+Government+Hospital/data=!4m7!3m6!1s0x3a3d585620c27b9b:0x1f440eecdd6db8ed!8m2!3d19.2601225!4d84.9052338!16s%2Fg%2F11c0r32gmp!19sChIJm3vCIFZYPToR7bht3ewORB8?authuser=0&hl=en&rclk=1",
    },
    {
      id: "17",
      Name: "Ecos Eye Hospital",
      Website: "http://www.ecoseye.org.in/",
      Rating: 3.8,
      Type: "Hospital",
      Contact: "073810 88009",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Ecos+Eye+Hospital+%28%E0%AC%87%E0%AC%95%E0%AD%8B%E0%AD%87%E0%AC%B8+%E0%AC%86%E0%AC%87+%E0%AC%B9%E0%AC%B8%E0%AD%8D%E0%AC%AA%E0%AC%BF%E0%AC%9F%E0%AC%BE%E0%AC%B2%29/data=!4m7!3m6!1s0x3a3d5a9f7237d3a5:0xa36d2b13a8d80d9!8m2!3d19.3003777!4d84.7954805!16s%2Fg%2F124sx052_!19sChIJpdM3cp9aPToR2YCNOrHSNgo?authuser=0&hl=en&rclk=1",
    },
    {
      id: "18",
      Name: "Aasha Health Care",
      Website: "",
      Rating: 3.8,
      Type: "Medical Center",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/AASHA+HELTH+CARE/data=!4m7!3m6!1s0x3a22abff6d63ed33:0xc0ec09ed4c6187c5!8m2!3d19.5069977!4d84.9251483!16s%2Fg%2F11w4dq0pkv!19sChIJM-1jbf-rIjoRxYdhTO0J7MA?authuser=0&hl=en&rclk=1",
    },
    {
      id: "19",
      Name: "Chatrapur S D Hospital",
      Website: "",
      Rating: 3,
      Type: "Medical Diagnostic Imaging Center",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Chatrapur+S+D+Hospital/data=!4m7!3m6!1s0x3a17fd8d47fee0f5:0x424e59c5d9d3f4ee!8m2!3d19.3561827!4d84.9875725!16s%2Fg%2F11t53l1p_3!19sChIJ9eD-R439FzoR7vTT2cVZTkI?authuser=0&hl=en&rclk=1",
    },
    {
      id: "20",
      Name: "Pratappur Hospital",
      Website: "",
      Rating: 3.8,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Pratappur+Hospital/data=!4m7!3m6!1s0x3a3d55c21f578bdd:0x10de2cd251d80478!8m2!3d19.4913415!4d84.9329741!16s%2Fg%2F11hzhfcy07!19sChIJ3YtXH8JVPToReATYUdIs3hA?authuser=0&hl=en&rclk=1",
    },
    {
      id: "21",
      Name: "Govt. Hospital",
      Website: "",
      Rating: 3.8,
      Type: "Hospital",
      Contact: "098535 44788",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Govt.+Hospital/data=!4m7!3m6!1s0x3a3d3257e53f9efd:0xab5da5a88f5295a!8m2!3d19.4366678!4d84.4703521!16s%2Fg%2F119w51l3n!19sChIJ_Z4_5VcyPToRWin1iFratQo?authuser=0&hl=en&rclk=1",
    },
    {
      id: "22",
      Name: "Chatrapur. Kec",
      Website: "",
      Rating: 3.2,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Chatra+pur.+Kec+in+Supewajara/data=!4m7!3m6!1s0x3a17ffe2ac017367:0xb99f9f4d38ce1f03!8m2!3d19.4257537!4d84.997895!16s%2Fg%2F11h7n9vfq4!19sChIJZ3MBrOL_FzoRAx_OOE2fn7k?authuser=0&hl=en&rclk=1",
    },
    {
      id: "23",
      Name: "PHC New Ganjam",
      Website: "",
      Rating: 4.3,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/PHC+New+Ganjam/data=!4m7!3m6!1s0x3a17fbc68a308473:0xc1a95d370afa40b6!8m2!3d19.3874817!4d85.0518188!16s%2Fg%2F11ddyswk4b!19sChIJc4Qwisb7FzoRtkD6CjddqcE?authuser=0&hl=en&rclk=1",
    },
    {
      id: "24",
      Name: "Suresh Clinic",
      Website: "",
      Rating: 4.5,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Suresh+Clinic/data=!4m7!3m6!1s0x3a3d43ae4e5fe2df:0x89ef93b5547670f3!8m2!3d19.168429!4d84.7229063!16s%2Fg%2F11hblxyd5j!19sChIJ3-JfTq5DPToR83B2VLWT74k?authuser=0&hl=en&rclk=1",
    },
    {
      id: "25",
      Name: "B.N.Pur Hospital",
      Website: "",
      Rating: 4.8,
      Type: "Hospital",
      Contact: "073819 01833",
      "Google Map Link":
        "https://www.google.co.in/maps/place/B.N.PUR+HOSPITAL,GANJAM/data=!4m7!3m6!1s0x3a18008bdd5dc00b:0x89f42a8e9d39818e!8m2!3d19.5505518!4d84.9563178!16s%2Fg%2F11g6yms44x!19sChIJC8Bd3YsAGDoRjoE5nY4q9Ik?authuser=0&hl=en&rclk=1",
    },
    {
      id: "26",
      Name: "Sai Dibyajyoti Hospital",
      Website: "",
      Rating: 4.5,
      Type: "Private hospital",
      Contact: "098535 44788",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Sai+Dibyajyoti+Hospital/data=!4m7!3m6!1s0x3a3d5160b53571e9:0xcb6a7ddf77ca1544!8m2!3d19.3146942!4d84.7982407!16s%2Fg%2F11tdhrl0_8!19sChIJ6XE1tWBRPToRRBXKd999ass?authuser=0&hl=en&rclk=1",
    },
    {
      id: "27",
      Name: "PHC Humma",
      Website: "",
      Rating: 4.3,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/PHC+Humma/data=!4m7!3m6!1s0x3a17f997a726fd55:0x2d4f0a4d7c99fdd!8m2!3d19.4280422!4d85.0769438!16s%2Fg%2F11c0xzxl1f!19sChIJVf0mp5f5FzoR3Z_J16Tw1AI?authuser=0&hl=en&rclk=1",
    },
    {
      id: "28",
      Name: "Prathamika Swastya Kendra",
      Website: "",
      Rating: 5,
      Type: "General Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Prathamika+Swastya+Kendra/data=!4m7!3m6!1s0x3a3d4c799b56485f:0x9eb828467cd82450!8m2!3d19.4344594!4d84.6941693!16s%2Fg%2F11f3s1941n!19sChIJX0hWm3lMPToRUCTYfEYouJ4?authuser=0&hl=en&rclk=1",
    },
    {
      id: "29",
      Name: "CHC, Bhatakumarada",
      Website: "",
      Rating: 4.5,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/CHC,+Bhatakumarada/data=!4m7!3m6!1s0x3a3d54666aaaaaab:0x663c06409c40e2a7!8m2!3d19.4379243!4d84.8734513!16s%2Fg%2F11b76ttq_l!19sChIJq6qqamZUPToRp-JAnEAGPGY?authuser=0&hl=en&rclk=1",
    },
    {
      id: "30",
      Name: "Goutami Primary Hospital",
      Website: "",
      Rating: 4.3,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Goutami+Primary+hospital/data=!4m7!3m6!1s0x3a3d4a2c6dcfeba9:0x4a54aaf13cb162b4!8m2!3d19.4016666!4d84.6442703!16s%2Fg%2F11dxm6z6tf!19sChIJqevPbSxKPToRtGKxPPGqVEo?authuser=0&hl=en&rclk=1",
    },
    {
      id: "31",
      Name: "Govt. Hospital",
      Website: "",
      Rating: 4,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Govt.+Hospital/data=!4m7!3m6!1s0x3a3d55549d1092d1:0x229de1c57b44583!8m2!3d19.4959659!4d84.9351225!16s%2Fg%2F11cs66rrtt!19sChIJ0ZIQnVRVPToRg0W0VxzeKQI?authuser=0&hl=en&rclk=1",
    },
    {
      id: "32",
      Name: "Kanchuru Government Hospital",
      Website: "",
      Rating: 4.5,
      Type: "Government Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Kanchuru+Government+Hospital/data=!4m7!3m6!1s0x3a3d4d8b5b9cccd3:0xd8a264ae649b061!8m2!3d19.423248!4d84.768588!16s%2Fg%2F11csb15xps!19sChIJ08ycW4tNPToRYbBJ5komig0?authuser=0&hl=en&rclk=1",
    },
    {
      id: "33",
      Name: "CHC Sheragada",
      Website: "",
      Rating: 4.5,
      Type: "Hospital",
      Contact: "094399 85240",
      "Google Map Link":
        "https://www.google.co.in/maps/place/CHC+SHERAGADA/data=!4m7!3m6!1s0x3a22ca9c15555555:0xbca687a391f746f3!8m2!3d19.518524!4d84.6049029!16s%2Fg%2F11btyrpqsg!19sChIJVVVVFZzKIjoR80b3kaOHprw?authuser=0&hl=en&rclk=1",
    },
    {
      id: "34",
      Name: "Government Primary Health Centre",
      Website: "",
      Rating: 5,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Government+Primary+Health+Centre/data=!4m7!3m6!1s0x3a22b6657aa4560b:0x855f70aded90da08!8m2!3d19.598594!4d84.638072!16s%2Fg%2F11c70hq9gp!19sChIJC1akemW2IjoRCNqQ7a1wX4U?authuser=0&hl=en&rclk=1",
    },
    {
      id: "35",
      Name: "Mathura Hospital",
      Website: "",
      Rating: 5,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Mathura+Hospital/data=!4m7!3m6!1s0x3a1804104b797c91:0xa913ec74031e1548!8m2!3d19.609474!4d85.0361863!16s%2Fg%2F11g6xrnw_n!19sChIJkXx5SxAEGDoRSBUeA3TsE6k?authuser=0&hl=en&rclk=1",
    },
    {
      id: "36",
      Name: "District Headquarter Hospital",
      Website: "",
      Rating: 1,
      Type: "Government Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/District+Headquarter+Hospital%28City+Hospital%29,Berhampur/data=!4m7!3m6!1s0x3a3d51d00720dff5:0xee671514769109b7!8m2!3d19.3148824!4d84.7955549!16s%2Fg%2F11vwsv2609!19sChIJ9d8gB9BRPToRtwmRdhQVZ-4?authuser=0&hl=en&rclk=1",
    },
    {
      id: "37",
      Name: "Bada Barasingi Government Hospital",
      Website: "",
      Rating: 2.5,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Bada+Barasingi+Government+Hospital/data=!4m7!3m6!1s0x3a22c1ad758059e1:0x674c4fccc4770d2d!8m2!3d19.830034!4d84.561535!16s%2Fg%2F11cn92_x3p!19sChIJ4VmAda3BIjoRLQ13xMxPTGc?authuser=0&hl=en&rclk=1",
    },
    {
      id: "38",
      Name: "Sub-Divisional Hospital",
      Website: "",
      Rating: 2.8,
      Type: "Hospital",
      Contact: "",
      "Google Map Link":
        "https://www.google.co.in/maps/place/Sub-Divisional+Hospital,+Bhanjanagar/data=!4m7!3m6!1s0x3a22eb16aae598ef:0xbe0250de20380104!8m2!3d19.9325582!4d84.5799686!16s%2Fg%2F11f553rkjz!19sChIJ75jlqhbrIjoRBAE4IN5QAr4?authuser=0&hl=en&rclk=1",
    },
  ];

  // --- 3) Component state ---
  const [searchInput, setSearchInput] = useState("");
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [diseaseInput, setDiseaseInput] = useState("");
  const [filteredDiseases, setFilteredDiseases] = useState([]);
  const [hospitalList, setHospitalList] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchBoxRef = useRef(null);
  const hospitalListRef = useRef(null);

  const promptRan = useRef(false);
  const FETCH_TOAST_ID = "fetching-location-toast";

  useEffect(() => {
    // Guard against double-invoke in StrictMode / Fast Refresh
    if (promptRan.current) return;
    promptRan.current = true;

    const timer = setTimeout(() => {
      const ok = window.confirm("Display nearby hospitals?");
      if (ok) {
        // Only show this toast once, even if this block runs twice
        toast.info("Fetching current location...", {
          toastId: FETCH_TOAST_ID,
          autoClose: 2000,
        });

        // After the toast’s 2s, populate & scroll
        setTimeout(() => {
          setSearchInput("Ganjam");
          setHospitalList(ganjamHospitals);
          setHasSearched(true);
          if (hospitalListRef.current) {
            const yOffset = -70;
            const yPos =
              hospitalListRef.current.getBoundingClientRect().top +
              window.pageYOffset +
              yOffset;
            window.scrollTo({ top: yPos, behavior: "smooth" });
          }
        }, 2000);
      }
    }, 1000);

    // Cleanup
    return () => clearTimeout(timer);
  }, []);  // empty deps

  // --- 5) Handlers for district & disease suggestion/search ---
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    setFilteredDistricts(
      query === ""
        ? districts
        : districts.filter((d) =>
            d.toLowerCase().startsWith(query.toLowerCase())
          )
    );
  };

  const handleDiseaseSearch = (e) => {
    const query = e.target.value;
    setDiseaseInput(query);
    setFilteredDiseases(
      query === ""
        ? diseases
        : diseases.filter((d) =>
            d.toLowerCase().startsWith(query.toLowerCase())
          )
    );
  };

  const handleSelectDistrict = (district) => {
    setSearchInput(district);
    setFilteredDistricts([]);
  };

  const handleSelectDisease = (disease) => {
    setDiseaseInput(disease);
    setFilteredDiseases([]);
  };

  // --- 6) Firestore fetch & scroll logic ---
  const fetchHospitals = async () => {
    try {
      const hospitalsCollection = collection(
        db,
        "Odisha",
        searchInput,
        "Hospitals"
      );
      const snapshot = await getDocs(hospitalsCollection);
      const hospitalsData = snapshot.empty
        ? []
        : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHospitalList(hospitalsData);
      setHasSearched(true);

      // smooth scroll:
      if (hospitalListRef.current) {
        const yOffset = -70;
        const yPosition =
          hospitalListRef.current.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: yPosition, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  const handleSearchButtonClick = () => {
    if (districts.includes(searchInput)) {
      fetchHospitals();
    } else {
      toast.error("Please enter a valid district!");
    }
  };

  // --- 7) Close suggestions on outside click ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setFilteredDistricts([]);
        setFilteredDiseases([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 8) Render ---
  return (
    <div className="section-container pt-[60px]" id="home">
      <div className="hero-section">
        <div className="text-section">
          <p className="text-headline">❤️ Health comes first</p>
          <h2 className="text-title">Find hospitals from your phone.</h2>
          <p className="text-description">
            Access accurate, up-to-date healthcare information tailored to your
            needs. Search providers by location, specialty, and ratings for
            enhanced healthcare decision making and accessibility.
          </p>

          <div
            className="search-area w-full flex flex-col sm:flex-row gap-5"
            ref={searchBoxRef}>
            {/* District Search Box */}
            <div className="search-box w-full sm:w-[40%] relative">
              <Input
                icon={
                  <button onClick={handleSearchButtonClick} aria-label="Search">
                    <TbSearch className="text-blue-600" />
                  </button>
                }
                label="Enter Location"
                className="bg-white text-[17px]"
                size="lg"
                color="blue"
                value={searchInput}
                onChange={handleSearch}
                onFocus={() => {
                  setFilteredDistricts(districts);
                  setFilteredDiseases([]);
                }}
              />
              <div className="absolute top-full left-0 w-full z-20">
                <SearchSuggestions
                  filteredDistricts={filteredDistricts}
                  onSelectDistrict={handleSelectDistrict}
                />
              </div>
            </div>

            {/* Disease Search Box */}
            <div className="search-box w-full sm:w-[40%] relative">
              <Input
                icon={
                  <button onClick={handleSearchButtonClick} aria-label="Search">
                    <TbSearch className="text-blue-600" />
                  </button>
                }
                label="Enter Disease"
                className="bg-white text-[17px]"
                size="lg"
                color="blue"
                value={diseaseInput}
                onChange={handleDiseaseSearch}
                onFocus={() => {
                  setFilteredDiseases(diseases);
                  setFilteredDistricts([]);
                }}
              />
              <div className="absolute top-full left-0 w-full z-20">
                <SearchSuggestions
                  filteredDistricts={filteredDiseases}
                  onSelectDistrict={handleSelectDisease}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="hero-image-section">
          <img className="hero-image1" src={Doctor} alt="Doctor" />
        </div>
      </div>

      {/* Hospital List */}
      <div
        ref={hospitalListRef}
        className={`${hospitalList.length > 0 ? "px-4 py-6" : ""}`}>
        <Hospitals
          hospitals={hospitalList}
          hasSearched={hasSearched}
          searchedDistrict={searchInput}
        />
      </div>

      <ToastContainer
        toastClassName="toast-container"
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default Hero;