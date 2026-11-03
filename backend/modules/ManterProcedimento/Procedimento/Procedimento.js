/** Entidade do catálogo. O banco guarda o mesmo formato em JSON. */
export class Procedimento {
  constructor(data = {}) {
    this.id = data.id || "";
    this.name = data.name || "";
    this.category = data.category || "";
    this.price = Number(data.price) || 0;
    this.duration_min = Number(data.duration_min ?? data.durationMin) || 0;
    this.description = data.description || "";
    this.active = data.active !== false;
    this.created_at = data.created_at || data.createdAt || null;
  }

  toDocument() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      price: this.price,
      duration_min: this.duration_min,
      description: this.description,
      active: this.active,
      created_at: this.created_at,
    };
  }
}
