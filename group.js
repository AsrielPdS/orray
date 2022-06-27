const { emit, on } = require("handler");

function push(g, items) {
  let indexes = Array(items.length), start = g.length;
  for (let i = 0; i < items.length; i++) {
    let item = items[i], index = g.l.indexOf(item);
    if (index != -1 && !g.includes(item)) {
      indexes[i] = index;
      g[start + i] = item;
    }
    else
      items.splice(i--, 1);
  }
  if (items.length) {
    // g.length += items.length;
    emit(g, 'push', items);
    if (!g.nu)
      emit(g, "set", { add: items, addId: indexes });
  }
  return indexes;
}
exports.Group = class extends Array {
  eh = {};
  slip;
  /**no update */
  nu;
  l;
  push(...items) {
    push(this, items);
    return this.length;
  }
  pushRange(start, end) {
    return push(this, this.l.slice(start, end));
  }
  pushAll() {
    return push(this, ...this.l.slice());
  }
  remove(...items) {
    let indexes = Array(items.length);
    for (let i = 0; i < items.length; i++) {
      let item = items[i], indexInList = this.l.indexOf(item), index = this.indexOf(item);
      if (index != -1) {
        indexes[i] = indexInList;
        for (let i = index; i < this.length - 1; i++)
          this[i] = this[i + 1];
        delete this[this.length - 1];
      }
      else
        items.splice(i--, 1);
    }
    this.length -= items.length;
    if (items.length) {
      emit(this, 'remove', items);
      if (!this.nu)
        emit(this, 'set', { remove: items, remvId: indexes });
    }
    return indexes;
  }
  removeAt(index, count = 0) {
    // for (let i = index; i < this.length - 1; i++)
    //   this[i] = this[i + 1];
    let item = this[index], items = [item];
    this.splice(index, count);
    // delete this[--this.length];
    emit(this, 'remove', items);
    if (!this.nu)
      emit(this, 'set', { remove: items, remvId: [this.indexOf(item)] });
  }
  clear() {
    return this.remove(...this);
  }
  removeRange(from, to) {
    return this.remove(...this.l.slice(from, to));
  }
  set(add) {
    if (!add.length && !this.length)
      return;
    this.nu = true;
    let r = this.slice(), remvId = this.clear(), addId = push(this, add);
    this.nu = false;
    emit(this, 'set', {
      remove: r, remvId,
      add, addId
    });
    return this;
  }
  invert() {
    this.set(this.l.filter(i => !this.includes(i)));
    return this;
  }
  setRange(start, end) {
    this.set(this.l.slice(start, end));
  }
  indexes() {
    for (var r = Array(this.length), i = 0; i < this.length; i++)
      r[i] = this.l.indexOf(this[i]);
    return r;
  }
  keyField() {
    for (var key = this.l.key, r = [], i = 0; i < this.length; i++)
      r.push(this[i][key]);
    return r;
  }
  /**on update */
  on(callback) {
    return on(this, "set", callback);
  }
  reload(v, i = this.l.indexOf(v)) {
    emit(this, "set", { add: [v], addId: [i] });
    return this;
  }
}


exports.bind = (l, s, groupKey, bond) => {
  let g = l.g[groupKey];
  if (g) {
    let call = (items, indexes, state) => {
      for (let i = 0; i < items.length; i++) {
        let id = indexes[i];
        bond.call(l, s.child(id), state, items[i], groupKey, id, s);
      }
    };
    on(g, "set", e => {
      if (e.add)
        call(e.add, e.addId, true);
      if (e.remove)
        call(e.remove, e.remvId, false);
    });
  }
  else
    console.error(`group '${groupKey}' not found`);
  return s;
}
