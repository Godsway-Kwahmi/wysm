import {defineType, defineField, defineArrayMember} from 'sanity'
import {StarIcon} from '@sanity/icons'

/**
 * A creative work \u2014 a staged production, a short story, a novel,
 * or any other piece the Creative Works section presents.
 *
 * The newest by `date` can be shown as the home page's featured
 * creative work. Every work appears in the Creative Works list on the
 * Creative Interventions page, newest first, and in search results.
 * The three standing strand descriptions on that page are edited
 * separately, on the page document itself \u2014 not here.
 */
export const intervention = defineType({
  name: 'intervention',
  title: 'Creative work',
  type: 'document',
  icon: StarIcon,
  groups: [
    {name: 'details', title: 'Details', default: true},
    {name: 'feature', title: 'Feature copy'},
    {name: 'gallery', title: 'Gallery'},
  ],
  fields: [
    defineField({
      name: 'kind',
      title: 'Format',
      type: 'string',
      group: 'details',
      description:
        'The label shown above the title in the Creative Works list \u2014 for example "Community Theatre Production", "Short Story" or "Novel".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      group: 'details',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      type: 'date',
      group: 'details',
      description:
        'Sets the order of the Creative Works list and search results, and decides which work is "most recent." For a book, its publication date; for a production, when it was staged.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      type: 'string',
      group: 'details',
      description:
        'Where the work took place, or where it can be found. Shown only in search results \u2014 for example "Accra (Legon, Nungua and Madina) and Ho, Ghana".',
    }),
    defineField({
      name: 'url',
      title: 'Link',
      type: 'url',
      group: 'details',
      description:
        'A page, article, social post or publisher listing about this work. Leave empty if there is nothing to link to.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 8,
      group: 'feature',
      description:
        'The full description shown in the Creative Works detail view, and used when this work is featured on the home page or found in search. Leave a blank line between paragraphs.',
    }),
    defineField({
      name: 'image',
      title: 'Lead image',
      type: 'image',
      group: 'feature',
      options: {hotspot: true},
      description:
        'The single image shown in the Creative Works list and gallery tiles, and when this work is featured on the home page.',
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      group: 'gallery',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
        }),
      ],
      description:
        'Extra photos shown in the detail view below the summary, alongside the lead image above. Leave empty for a work that only needs the one lead image \u2014 a book cover, for instance.',
    }),
  ],
  orderings: [{title: 'Newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'kind', media: 'image'},
  },
})
