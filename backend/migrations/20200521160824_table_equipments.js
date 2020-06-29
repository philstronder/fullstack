
exports.up = function(knex, Promise) {
    return knex.schema.createTable('equipments', table => {
        table.increments('id').primary()
        table.string('name').notNull()
        table.integer('brand_id').unsigned()
        table.integer('category_id').notNull()
        table.timestamp('date_created')
            .defaultTo(knex.fn.now())
        table.foreign('brand_id').references('brand.id')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('equipments')
};
