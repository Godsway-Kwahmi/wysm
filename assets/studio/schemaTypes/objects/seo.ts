import {defineType, defineField} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'Search & Social',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The title shown in search engine results and the browser tab. Under 60 characters.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'One or two sentences shown in search results. Under 155 characters.',
    }),
  ],
})
