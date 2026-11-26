/* Boots & Booze progress report.
   Reads window.BBREPORT_DATA from data.js. Do not put figures in this file. */
(function () {
  'use strict';

  var TOKEN = /\{\{([a-zA-Z0-9]+)\}\}/g;

  function isBlank(value) {
    return value == null || (typeof value === 'string' && value.trim() === '');
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function showError(message) {
    var box = document.getElementById('report-error');
    var report = document.getElementById('report');
    if (report) {
      clear(report);
      report.hidden = true;
    }
    if (!box) return;
    box.hidden = false;
    box.textContent = message;
  }

  function formatCount(n) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n);
  }

  /* A view total is a finite number >= 0, or null (pending). Anything else is a mistake to fix. */
  function readCount(value) {
    if (value === null || typeof value === 'undefined') {
      return { state: 'pending' };
    }
    if (typeof value === 'number' && isFinite(value) && value >= 0) {
      return { state: 'value', value: value };
    }
    return {
      state: 'invalid',
      message: 'Enter a number or null. No quotes, and no guessed figure.'
    };
  }

  function countNode(reading) {
    if (reading.state === 'value') return document.createTextNode(formatCount(reading.value));
    if (reading.state === 'invalid') return el('span', 'invalid', reading.message);
    return el('span', 'pending', 'Pending');
  }

  function rangeText(period) {
    if (!period) return '';
    var start = isBlank(period.start) ? '' : String(period.start).trim();
    var end = isBlank(period.end) ? '' : String(period.end).trim();
    if (start && end) return start + ' \u2013 ' + end;
    return start || end;
  }

  function isDraft(text) {
    return typeof text === 'string' && /^\s*\[Brian\b/i.test(text);
  }

  function changeInfo(data) {
    var before = readCount(data.postingPeriod && data.postingPeriod.views);
    var after = readCount(data.postHalt && data.postHalt.views);
    if (before.state !== 'value' || after.state !== 'value') {
      return { kind: 'pending' };
    }
    if (before.value === 0) {
      if (after.value === 0) {
        return { kind: 'flat', sentence: 'No change from the posting period.' };
      }
      return {
        kind: 'undefined',
        sentence: 'Percent change is not defined, because the posting-period total is zero.'
      };
    }
    var raw = ((after.value - before.value) / before.value) * 100;
    var rounded = Math.round(raw * 10) / 10;
    if (rounded === 0) {
      return { kind: 'flat', sentence: 'No change from the posting period.' };
    }
    var abs = Math.abs(rounded);
    var digits = Math.round(abs * 10) % 10 === 0 ? String(Math.round(abs)) : abs.toFixed(1);
    var pctText = digits + '%';
    var kind = rounded > 0 ? 'up' : 'down';
    var word = kind === 'up' ? 'Up ' : 'Down ';
    return {
      kind: kind,
      pctText: pctText,
      sentence: word + pctText + ' from the posting period.'
    };
  }

  function tokenResult(name, data, change) {
    var posting = data.postingPeriod || {};
    var halt = data.postHalt || {};
    if (name === 'postingViews') return countToken(readCount(posting.views));
    if (name === 'postHaltViews') return countToken(readCount(halt.views));
    if (name === 'postingRange') return textOrPending(rangeText(posting));
    if (name === 'postHaltRange') return textOrPending(rangeText(halt));
    if (name === 'changeSentence') {
      if (change.kind === 'pending') return { pending: true };
      return { text: change.sentence };
    }
    var plain = {
      client: data.client,
      audience: data.audience,
      author: data.author,
      studio: data.studio,
      place: data.place,
      platform: data.platform,
      handoffFirm: data.handoffFirm,
      handoffDate: data.handoffDate,
      followUpDate: data.followUpDate,
      authorRole: data.authorRole
    };
    if (Object.prototype.hasOwnProperty.call(plain, name)) {
      return textOrPending(plain[name]);
    }
    return { text: '{{' + name + '}}' };
  }

  function countToken(reading) {
    if (reading.state === 'value') return { text: formatCount(reading.value) };
    if (reading.state === 'invalid') return { text: reading.message };
    return { pending: true };
  }

  function textOrPending(value) {
    if (isBlank(value)) return { pending: true };
    return { text: String(value) };
  }

  function appendRich(parent, template, data, change) {
    var str = template == null ? '' : String(template);
    var re = new RegExp(TOKEN.source, 'g');
    var last = 0;
    var match;
    while ((match = re.exec(str))) {
      if (match.index > last) {
        parent.appendChild(document.createTextNode(str.slice(last, match.index)));
      }
      var token = tokenResult(match[1], data, change);
      if (token.pending) parent.appendChild(el('span', 'pending', 'Pending'));
      else parent.appendChild(document.createTextNode(token.text));
      last = match.index + match[0].length;
    }
    if (last < str.length) parent.appendChild(document.createTextNode(str.slice(last)));
  }

  function appendDraft(parent, text) {
    var p = el('p', 'draft');
    p.appendChild(el('span', 'draft__tag', 'For Brian \u2014 replace before you send this'));
    p.appendChild(el('span', 'draft__body', String(text).trim()));
    parent.appendChild(p);
  }

  function appendCopy(parent, text, data, change) {
    if (isBlank(text)) return;
    if (isDraft(text)) {
      appendDraft(parent, text);
      return;
    }
    var p = el('p');
    appendRich(p, text, data, change);
    parent.appendChild(p);
  }

  function fillChange(node, change) {
    if (change.kind === 'pending') {
      node.appendChild(el('span', 'pending', 'Pending'));
      return;
    }
    if (change.kind === 'undefined') {
      node.textContent = change.sentence;
      return;
    }
    if (change.kind === 'flat') {
      node.appendChild(el('strong', null, 'No change'));
      node.appendChild(document.createTextNode(' from the posting period.'));
      return;
    }
    node.appendChild(document.createTextNode(change.kind === 'up' ? 'Up ' : 'Down '));
    node.appendChild(el('strong', null, change.pctText));
    node.appendChild(document.createTextNode(' from the posting period.'));
  }

  function periodColumn(period, described) {
    var col = el('span', 'pair__col');
    var reading = readCount(period && period.views);
    var label = el('span', 'pair__label', isBlank(period && period.label) ? described : period.label);
    col.appendChild(label);

    var num = el('span', 'num');
    num.appendChild(countNode(reading));
    col.appendChild(num);

    var unit = 'Views';
    if (period && !isBlank(period.span)) unit += ' \u00b7 ' + String(period.span).trim();
    col.appendChild(el('span', 'pair__unit', unit));

    var dates = el('span', 'pair__dates');
    var range = rangeText(period);
    if (range) {
      dates.textContent = range;
    } else {
      dates.appendChild(el('span', 'pair__key', 'Dates'));
      dates.appendChild(el('span', 'pending', 'Pending'));
    }
    col.appendChild(dates);
    return col;
  }

  function barRow(period) {
    var reading = readCount(period && period.views);
    var row = el('div', 'bar');
    var meta = el('div', 'bar__meta');
    meta.appendChild(el('span', 'bar__label', isBlank(period && period.label) ? 'Views' : period.label));
    var value = el('span', 'bar__value');
    value.appendChild(countNode(reading));
    meta.appendChild(value);
    row.appendChild(meta);

    if (reading.state === 'value') {
      var track = el('div', 'track');
      var fill = el('span', 'fill');
      fill.style.setProperty('--w', '0%');
      track.appendChild(fill);
      row.appendChild(track);
      row._fill = fill;
      row._value = reading.value;
    } else if (reading.state === 'invalid') {
      row.appendChild(el('div', 'track is-pending'));
    } else {
      /* Full-width dashed track. No fill, so a missing total is not drawn as zero. */
      row.appendChild(el('div', 'track is-pending'));
    }
    return row;
  }

  function chartLabel(rows) {
    return rows.map(function (row) {
      var reading = readCount(row.period && row.period.views);
      var name = isBlank(row.period && row.period.label) ? 'Views' : row.period.label;
      if (reading.state === 'value') return name + ': ' + formatCount(reading.value) + ' views';
      if (reading.state === 'invalid') return name + ': not a usable number, no bar drawn';
      return name + ': pending, no bar drawn';
    }).join('. ');
  }

  function metricValue(reading) {
    var node = el('p', 'metric__value');
    node.appendChild(countNode(reading));
    return node;
  }

  function topPosts(list) {
    var usable = [];
    (list || []).forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      var labelBlank = isBlank(item.label);
      var views = readCount(item.views);
      if (labelBlank && views.state === 'pending') return;
      usable.push({ label: labelBlank ? null : String(item.label).trim(), views: views });
    });
    return usable;
  }

  function render(data) {
    var change = changeInfo(data);
    var both = change.kind !== 'pending';
    var hero = data.hero || {};
    var comparison = data.comparison || {};
    var metricsCopy = data.metricsSection || {};
    var narrative = data.narrative || {};
    var next = data.nextSteps || {};
    var contact = data.contact || {};
    var metrics = data.metrics || {};
    var main = document.getElementById('report');
    var frag = document.createDocumentFragment();

    var mast = el('header', 'mast wrap');
    var brand = el('a', 'mast__brand', isBlank(data.studio) ? 'Chalant Creative' : data.studio);
    brand.href = '../';
    mast.appendChild(brand);
    var metaBits = ['Progress report'];
    if (!isBlank(data.client)) metaBits.push(data.client);
    if (!isBlank(data.place)) metaBits.push(data.place);
    if (!isBlank(data.platform)) metaBits.push(data.platform);
    var meta = el('p', 'mast__meta');
    metaBits.forEach(function (bit, i) {
      if (i) meta.appendChild(document.createElement('br'));
      meta.appendChild(document.createTextNode(bit));
    });
    mast.appendChild(meta);
    frag.appendChild(mast);

    var heroBlock = el('section', 'block hero wrap');
    heroBlock.setAttribute('aria-labelledby', 'compare-heading');
    var kicker = el('p', 'eyebrow');
    appendRich(kicker, isBlank(hero.kicker) ? 'Progress report' : hero.kicker, data, change);
    heroBlock.appendChild(kicker);

    var h1 = el('h1', 'pair');
    h1.id = 'compare-heading';
    var hiddenLead = 'Social progress report';
    if (!isBlank(data.client)) hiddenLead = data.client + ' social progress report';
    h1.appendChild(el('span', 'visually-hidden', hiddenLead + '. '));
    h1.appendChild(periodColumn(data.postingPeriod, 'While posting'));
    h1.appendChild(periodColumn(data.postHalt, 'When Nativz took over'));
    heroBlock.appendChild(h1);

    var changeP = el('p', 'change');
    changeP.appendChild(el('span', 'change__label', 'Change'));
    var changeValue = el('span', 'change__value');
    fillChange(changeValue, change);
    changeP.appendChild(changeValue);
    heroBlock.appendChild(changeP);

    var dek = el('p', 'dek');
    var dekTemplate = both ? hero.dekComplete : hero.dekPending;
    if (!isBlank(dekTemplate)) {
      appendRich(dek, dekTemplate, data, change);
      heroBlock.appendChild(dek);
    }
    frag.appendChild(heroBlock);

    var chartSection = el('section', 'block wrap');
    chartSection.setAttribute('aria-labelledby', 'comparison-heading');
    chartSection.appendChild(el('p', 'eyebrow', isBlank(comparison.kicker) ? 'Comparison' : comparison.kicker));
    chartSection.appendChild(el('h2', 'section-title', isBlank(comparison.title) ? 'Drawn to scale.' : comparison.title));
    chartSection.id = 'comparison-heading-wrap';
    chartSection.querySelector('h2').id = 'comparison-heading';

    var figure = el('figure', 'chart');
    var caption = el('figcaption', 'chart__note');
    var noteTemplate = both ? comparison.noteComplete : comparison.notePending;
    if (!isBlank(noteTemplate)) appendRich(caption, noteTemplate, data, change);
    figure.appendChild(caption);

    var postingBar = barRow(data.postingPeriod || {});
    var haltBar = barRow(data.postHalt || {});
    var visual = el('div', 'chart__visual');
    visual.setAttribute('role', 'img');
    visual.setAttribute('aria-label', chartLabel([
      { period: data.postingPeriod },
      { period: data.postHalt }
    ]));
    visual.appendChild(postingBar);
    visual.appendChild(haltBar);
    figure.appendChild(visual);
    chartSection.appendChild(figure);
    frag.appendChild(chartSection);

    var metricSection = el('section', 'block wrap');
    metricSection.appendChild(el('p', 'eyebrow', isBlank(metricsCopy.kicker) ? 'Also on the account' : metricsCopy.kicker));
    var metricTitle = el('h2', 'section-title', isBlank(metricsCopy.title) ? 'Other figures.' : metricsCopy.title);
    metricTitle.id = 'metrics-heading';
    metricSection.setAttribute('aria-labelledby', 'metrics-heading');
    metricSection.appendChild(metricTitle);
    if (!isBlank(metricsCopy.dek)) {
      var metricDek = el('p', 'dek');
      metricDek.style.marginTop = '22px';
      appendRich(metricDek, metricsCopy.dek, data, change);
      metricSection.appendChild(metricDek);
    }

    var metricGrid = el('div', 'metrics');
    function addSimpleMetric(label, value) {
      var cell = el('div', 'metric');
      cell.appendChild(el('h3', 'metric__label', label));
      cell.appendChild(metricValue(readCount(value)));
      metricGrid.appendChild(cell);
    }
    addSimpleMetric('Followers', metrics.followers);
    addSimpleMetric('Average views per post', metrics.avgViewsPerPost);

    var posts = topPosts(metrics.topPosts);
    var postCell = el('div', 'metric' + (posts.length ? ' metric--list' : ''));
    postCell.appendChild(el('h3', 'metric__label', 'Top posts'));
    if (!posts.length) {
      if (metrics.topPosts != null && !Array.isArray(metrics.topPosts)) {
        postCell.appendChild(metricValue({
          state: 'invalid',
          message: 'topPosts should be null, or a list of label and views.'
        }));
      } else {
        postCell.appendChild(metricValue({ state: 'pending' }));
      }
    } else {
      var list = el('ol', 'posts');
      posts.forEach(function (post) {
        var item = el('li', 'post');
        if (post.label) item.appendChild(el('span', 'post__label', post.label));
        else {
          var pendingLabel = el('span', 'post__label');
          pendingLabel.appendChild(el('span', 'pending', 'Pending'));
          item.appendChild(pendingLabel);
        }
        var views = el('span', 'post__views');
        views.appendChild(countNode(post.views));
        item.appendChild(views);
        list.appendChild(item);
      });
      postCell.appendChild(list);
    }
    metricGrid.appendChild(postCell);
    metricSection.appendChild(metricGrid);
    frag.appendChild(metricSection);

    var notes = el('section', 'block wrap');
    notes.appendChild(el('p', 'eyebrow', isBlank(narrative.kicker) ? 'Notes' : narrative.kicker));
    var notesTitle = el('h2', 'section-title', isBlank(narrative.title) ? 'Notes.' : narrative.title);
    notesTitle.id = 'notes-heading';
    notes.setAttribute('aria-labelledby', 'notes-heading');
    notes.appendChild(notesTitle);
    var prose = el('div', 'prose');
    (narrative.paragraphs || []).forEach(function (paragraph) {
      appendCopy(prose, paragraph, data, change);
    });
    if (!prose.childNodes.length) {
      var emptyNotes = el('p');
      emptyNotes.style.marginTop = '28px';
      emptyNotes.appendChild(el('span', 'pending', 'Pending'));
      prose.appendChild(emptyNotes);
    }
    notes.appendChild(prose);
    frag.appendChild(notes);

    frag.appendChild(renderClaims(data, change));

    var close = el('section', 'block wrap');
    close.appendChild(el('p', 'eyebrow', isBlank(next.kicker) ? 'Next' : next.kicker));
    var closeTitle = el('h2', 'section-title', isBlank(next.title) ? 'What happens next.' : next.title);
    closeTitle.id = 'next-heading';
    close.setAttribute('aria-labelledby', 'next-heading');
    close.appendChild(closeTitle);

    var items = (next.items || []).filter(function (item) { return !isBlank(item); });
    if (!items.length) {
      var noSteps = el('p', 'dek');
      noSteps.style.marginTop = '28px';
      noSteps.appendChild(el('span', 'pending', 'Pending'));
      close.appendChild(noSteps);
    } else {
      var ol = el('ol', 'steps');
      items.forEach(function (item, index) {
        var li = el('li', 'steps__item');
        var n = String(index + 1);
        if (n.length < 2) n = '0' + n;
        li.appendChild(el('span', 'steps__n', n));
        var body = el('div', 'steps__body');
        if (isDraft(item)) appendDraft(body, item);
        else appendRich(body, item, data, change);
        li.appendChild(body);
        ol.appendChild(li);
      });
      close.appendChild(ol);
    }

    var contactBlock = el('div', 'contact');
    var who = !isBlank(data.author) ? data.author : '';
    var nameEl = el('h3', 'contact__name');
    if (who) nameEl.textContent = who;
    else nameEl.appendChild(el('span', 'pending', 'Pending'));
    contactBlock.appendChild(nameEl);

    var roleBits = [];
    if (!isBlank(data.authorRole)) roleBits.push(String(data.authorRole).trim());
    if (!isBlank(data.studio)) roleBits.push(String(data.studio).trim());
    var role = el('p', 'contact__role');
    if (roleBits.length) role.textContent = roleBits.join(', ');
    else role.appendChild(el('span', 'pending', 'Pending'));
    contactBlock.appendChild(role);

    contactBlock.appendChild(contactLine('Email', contact.email, 'email'));
    contactBlock.appendChild(contactLine('Phone', contact.phone, 'phone'));

    if (!isBlank(contact.note)) {
      var noteWrap = el('div', 'contact__note');
      appendCopy(noteWrap, contact.note, data, change);
      contactBlock.appendChild(noteWrap);
    }
    close.appendChild(contactBlock);

    var source = el('p', 'source');
    var sourceTemplate = both ? data.sourceComplete : data.sourcePending;
    if (!isBlank(sourceTemplate)) appendRich(source, sourceTemplate, data, change);
    else source.appendChild(el('span', 'pending', 'Pending'));
    close.appendChild(source);
    frag.appendChild(close);

    var foot = el('footer', 'foot');
    var footInner = el('div', 'foot__inner');
    var footBrand = el('a', null, isBlank(data.studio) ? 'Chalant Creative' : data.studio);
    footBrand.href = '../';
    footInner.appendChild(footBrand);
    var footNote = el('p', null, 'Private report. Not listed.');
    footInner.appendChild(footNote);
    foot.appendChild(footInner);
    frag.appendChild(foot);

    clear(main);
    main.appendChild(frag);
    main.hidden = false;

    requestAnimationFrame(function () {
      scaleBars(postingBar, haltBar);
    });
  }

  function renderClaims(data, change) {
    var claims = data.claims || {};
    var paragraphs = (claims.paragraphs || []).filter(function (item) { return !isBlank(item); });
    var hasQuestion = !isBlank(claims.question);
    if (!paragraphs.length && !hasQuestion && isBlank(claims.title)) return document.createDocumentFragment();

    var section = el('section', 'block wrap');
    var kicker = isBlank(claims.kicker) ? 'Two claims' : claims.kicker;
    section.appendChild(el('p', 'eyebrow', kicker));
    var title = el('h2', 'section-title', isBlank(claims.title) ? 'On views and revenue.' : claims.title);
    title.id = 'claims-heading';
    section.setAttribute('aria-labelledby', 'claims-heading');
    section.appendChild(title);

    if (paragraphs.length) {
      var prose = el('div', 'prose');
      paragraphs.forEach(function (paragraph) {
        appendCopy(prose, paragraph, data, change);
      });
      section.appendChild(prose);
    }

    if (hasQuestion) {
      var quote = el('blockquote', 'pull');
      if (!isBlank(claims.questionLabel)) {
        quote.appendChild(el('span', 'pull__label', claims.questionLabel));
      }
      if (isDraft(claims.question)) {
        appendDraft(quote, claims.question);
      } else {
        var line = el('p', 'pull__text');
        appendRich(line, claims.question, data, change);
        quote.appendChild(line);
      }
      section.appendChild(quote);
    }

    return section;
  }

  function scaleBars(postingBar, haltBar) {
    var rows = [postingBar, haltBar].filter(function (row) { return row && row._fill; });
    if (!rows.length) return;
    var max = 0;
    rows.forEach(function (row) {
      if (row._value > max) max = row._value;
    });
    rows.forEach(function (row) {
      var pct = max === 0 ? 0 : (row._value / max) * 100;
      row._fill.style.setProperty('--w', pct + '%');
      row._fill.classList.add('is-in');
    });
  }

  function contactLine(label, value, kind) {
    var line = el('p', 'contact__line');
    line.appendChild(el('span', 'contact__key', label));
    if (isBlank(value)) {
      line.appendChild(el('span', 'pending', 'Pending'));
      return line;
    }
    var text = String(value).trim();
    if (kind === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      var mail = el('a', null, text);
      mail.href = 'mailto:' + text;
      line.appendChild(mail);
      return line;
    }
    if (kind === 'phone' && /^[+().\-\s0-9]{7,}$/.test(text)) {
      var tel = el('a', null, text);
      tel.href = 'tel:' + text.replace(/[^\d+]/g, '');
      line.appendChild(tel);
      return line;
    }
    line.appendChild(document.createTextNode(text));
    return line;
  }

  if (!window.BBREPORT_DATA || typeof window.BBREPORT_DATA !== 'object') {
    showError('This report could not read data.js. If you just edited it, a comma or a quote is probably off. Nothing here is estimated.');
    return;
  }

  try {
    render(window.BBREPORT_DATA);
  } catch (err) {
    showError('This report could not be drawn. ' + (err && err.message ? err.message : 'Check data.js.') + ' Nothing here is estimated.');
  }
})();
