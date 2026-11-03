import type {StructureResolver} from 'sanity/structure'

const singletons = [
  {id: 'homePage', title: 'Home page'},
  {id: 'aboutPage', title: 'About page'},
  {id: 'publicationsPage', title: 'Publications page'},
  {id: 'creativeWorksPage', title: 'Creative Works page'},
  {id: 'programsPage', title: 'Programs page'},
  {id: 'contactPage', title: 'Contact page'},
  {id: 'siteSettings', title: 'Site settings'},
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      ...singletons.map((s) =>
        S.listItem()
          .title(s.title)
          .id(s.id)
          .child(S.document().schemaType(s.id).documentId(s.id))
      ),
      S.divider(),
      S.documentTypeListItem('publication').title('Publications'),
      S.documentTypeListItem('intervention').title('Creative work'),
      S.documentTypeListItem('page').title('Custom pages'),
    ])
