import {defineType, defineField} from 'sanity'

export const strand = defineType({
  name: 'strand',
  title: 'Strand',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Strand title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
