/* ============================================================================
 * greek-holidays.js — Ελληνικές αργίες (σταθερές + κινητές) 2023–2040+
 * Για την εφαρμογή ΤΑΜΕΙΑ (ΑΦΟΙ ΡΟΥΣΣΑ Ο.Ε.)
 *
 * ΚΑΘΑΡΑ ΟΠΤΙΚΗ ΕΝΔΕΙΞΗ — ΔΕΝ αγγίζει κανέναν οικονομικό υπολογισμό.
 * Global functions (η app είναι inline-script, χωρίς modules):
 *   getOrthodoxEaster(year)            → Date (Κυριακή Πάσχα, Gregorian)
 *   getGreekHolidays(year)             → [{date:'YYYY-MM-DD', name, type}]
 *   getGreekHolidaysRange(startY,endY) → [...]
 *   isGreekHoliday(date)               → boolean
 *   getHolidayName(date)               → string | null
 *   getHolidayInfo(date)               → {name,type} | null
 *
 * date input: Date object Ή 'YYYY-MM-DD' string Ή (year,monthIndex0,day) μέσω Date.
 * ========================================================================== */
(function(global){
  'use strict';

  // --- helpers (local time, ΧΩΡΙΣ timezone bugs) ---
  function pad2(n){ return (n<10?'0':'')+n; }
  function ymd(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
  function addDays(d, n){ var x=new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate()+n); return x; }
  // Μετατροπή οποιουδήποτε input σε 'YYYY-MM-DD'
  function toKey(input){
    if(input==null) return null;
    if(typeof input==='string'){
      // δέχεται 'YYYY-MM-DD' (ή με ώρα 'YYYY-MM-DDThh:..')
      var m=input.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if(m) return m[1]+'-'+m[2]+'-'+m[3];
      var d=new Date(input); return isNaN(d)?null:ymd(d);
    }
    if(input instanceof Date){ return isNaN(input)?null:ymd(input); }
    return null;
  }

  /* ----------------------------------------------------------------------
   * Ορθόδοξο Πάσχα (Gregorian) — αλγόριθμος Meeus (Julian) + 13 ημέρες
   * Ισχύει σωστά για 1900–2099 (η σταθερά +13 αφορά αυτό το διάστημα).
   * -------------------------------------------------------------------- */
  function getOrthodoxEaster(year){
    var a = year % 4;
    var b = year % 7;
    var c = year % 19;
    var d = (19*c + 15) % 30;
    var e = (2*a + 4*b - d + 34) % 7;
    var month = Math.floor((d + e + 114) / 31); // 3=Μάρτιος, 4=Απρίλιος (Julian)
    var day   = ((d + e + 114) % 31) + 1;
    // Julian → Gregorian (+13 ημέρες για 1900–2099)
    var julian = new Date(year, month-1, day);
    return addDays(julian, 13);
  }

  /* ----------------------------------------------------------------------
   * HOLIDAY_OVERRIDES — χειροκίνητες εξαιρέσεις/διορθώσεις ανά έτος.
   * Χρήση: όταν εκδοθεί ΦΕΚ που ορίζει διαφορετική ημ. μετάθεσης Πρωτομαγιάς
   * (ή οποιαδήποτε ειδική αργία), πρόσθεσε εδώ — ΥΠΕΡΙΣΧΥΕΙ της αυτόματης λογικής.
   * Format: { '2027': [{date:'2027-05-04', name:'Εργατική Πρωτομαγιά (μετάθεση)', type:'override'}] }
   * (Αν δώσεις εγγραφή μετάθεσης Πρωτομαγιάς, αντικαθιστά την αυτόματη.)
   * -------------------------------------------------------------------- */
  var HOLIDAY_OVERRIDES = {
    // (κενό — η αυτόματη λογική καλύπτει 2023-2040· συμπλήρωσε μόνο αν διαφέρει το ΦΕΚ)
  };

  /* Παρατηρούμενη (μετατεθειμένη) Εργατική Πρωτομαγιά.
   * Ιστορικός κανόνας ελληνικού κράτους όταν η 1/5 συμπίπτει με Πάσχα/Σαββατοκύριακο:
   *  - μέσα στο Πάσχα (Μ.Σάββατο/Κυρ.Πάσχα/Δευτ.Πάσχα) → Τρίτη μετά τη Δευτέρα του Πάσχα (Πάσχα+2)
   *  - Κυριακή (όχι Πάσχα) → Δευτέρα (επόμενη μέρα)
   *  - Σάββατο (όχι Πάσχα) → Δευτέρα (μεθεπόμενη)
   * Επιστρέφει Date ή null (αν δεν χρειάζεται μετάθεση). */
  function observedMayDay(year, easter){
    var may1 = new Date(year,4,1);
    var k1 = ymd(may1);
    var inEaster = (k1===ymd(addDays(easter,-1)) || k1===ymd(easter) || k1===ymd(addDays(easter,1)));
    if(inEaster) return addDays(easter,2);
    var dow = may1.getDay(); // 0=Κυρ, 6=Σαβ
    if(dow===0) return addDays(may1,1);
    if(dow===6) return addDays(may1,2);
    return null;
  }

  /* ----------------------------------------------------------------------
   * Όλες οι αργίες ενός έτους
   * -------------------------------------------------------------------- */
  function getGreekHolidays(year){
    var easter = getOrthodoxEaster(year);
    var list = [
      // Σταθερές
      { date: year+'-01-01', name: 'Πρωτοχρονιά', type: 'fixed' },
      { date: year+'-01-06', name: 'Θεοφάνεια', type: 'fixed' },
      { date: year+'-03-25', name: '25η Μαρτίου', type: 'fixed' },
      { date: year+'-05-01', name: 'Εργατική Πρωτομαγιά', type: 'fixed' },
      { date: year+'-08-15', name: 'Κοίμηση της Θεοτόκου', type: 'fixed' },
      { date: year+'-10-28', name: '28η Οκτωβρίου', type: 'fixed' },
      { date: year+'-12-25', name: 'Χριστούγεννα', type: 'fixed' },
      { date: year+'-12-26', name: 'Σύναξη της Θεοτόκου', type: 'fixed' },
      // Κινητές (offset από Κυριακή Πάσχα)
      { date: ymd(addDays(easter,-48)), name: 'Καθαρά Δευτέρα', type: 'movable' },
      { date: ymd(addDays(easter, -2)), name: 'Μεγάλη Παρασκευή', type: 'movable' },
      { date: ymd(addDays(easter, -1)), name: 'Μεγάλο Σάββατο', type: 'movable' },
      { date: ymd(easter),             name: 'Κυριακή του Πάσχα', type: 'movable' },
      { date: ymd(addDays(easter, 1)), name: 'Δευτέρα του Πάσχα', type: 'movable' },
      { date: ymd(addDays(easter, 50)),name: 'Αγίου Πνεύματος', type: 'movable' }
    ];
    // Αυτόματη μετάθεση Εργατικής Πρωτομαγιάς (όταν συμπίπτει με Πάσχα/Σαββατοκύριακο)
    var moved = observedMayDay(year, easter);
    var hasOverrideMay = (HOLIDAY_OVERRIDES[year]||HOLIDAY_OVERRIDES[String(year)]||[]).some(function(o){ return /Πρωτομαγιά/.test(o.name); });
    if(moved && !hasOverrideMay){
      list.push({ date: ymd(moved), name: 'Εργατική Πρωτομαγιά (μετάθεση)', type: 'movable' });
    }
    // Χειροκίνητες εξαιρέσεις (ΥΠΕΡΙΣΧΥΟΥΝ)
    var ov = HOLIDAY_OVERRIDES[year] || HOLIDAY_OVERRIDES[String(year)];
    if(ov && ov.length){ ov.forEach(function(o){ list.push({date:o.date, name:o.name, type:o.type||'override'}); }); }
    list.sort(function(x,y){ return x.date < y.date ? -1 : (x.date > y.date ? 1 : 0); });
    return list;
  }

  function getGreekHolidaysRange(startYear, endYear){
    var out=[];
    for(var y=startYear; y<=endYear; y++){ out = out.concat(getGreekHolidays(y)); }
    return out;
  }

  // --- Cache ανά έτος (Map: 'YYYY-MM-DD' → {name,type}) για ταχύτητα ---
  var _cache = {};
  function _yearMap(year){
    if(!_cache[year]){
      var m={};
      getGreekHolidays(year).forEach(function(h){
        if(m[h.date]){ if(m[h.date].name.indexOf(h.name)===-1) m[h.date].name += ' / ' + h.name; } // συνδυασμός όταν 2 αργίες ίδια μέρα
        else m[h.date]={name:h.name, type:h.type};
      });
      _cache[year]=m;
    }
    return _cache[year];
  }

  function getHolidayInfo(date){
    var key = toKey(date);
    if(!key) return null;
    var year = parseInt(key.slice(0,4),10);
    var m = _yearMap(year);
    return m[key] || null;
  }
  function isGreekHoliday(date){ return getHolidayInfo(date) !== null; }
  function getHolidayName(date){ var i=getHolidayInfo(date); return i ? i.name : null; }

  // --- Export (global) ---
  global.getOrthodoxEaster     = getOrthodoxEaster;
  global.getGreekHolidays      = getGreekHolidays;
  global.getGreekHolidaysRange = getGreekHolidaysRange;
  global.isGreekHoliday        = isGreekHoliday;
  global.getHolidayName        = getHolidayName;
  global.getHolidayInfo        = getHolidayInfo;
  // namespaced επίσης (ασφάλεια)
  global.GreekHolidays = {
    getOrthodoxEaster: getOrthodoxEaster,
    getGreekHolidays: getGreekHolidays,
    getGreekHolidaysRange: getGreekHolidaysRange,
    isGreekHoliday: isGreekHoliday,
    getHolidayName: getHolidayName,
    getHolidayInfo: getHolidayInfo
  };

})(typeof window!=='undefined' ? window : this);
