import { execute } from 'graphql';
import { gql } from 'graphql-tag';
import { prisma } from './example/builder';
import schema from './example/schema';

let queries: unknown[] = [];
prisma.$use((params, next) => {
  queries.push(params);

  return next(params);
});

describe('prisma counts', () => {
  afterEach(() => {
    queries = [];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('relationCount and count on connections', async () => {
    const query = gql`
      query {
        userConnection(first: 1) {
          totalCount
        }
        withFragment: userConnection(first: 1) {
          ...totalCountFragment
        }
        withInlineFragment: userConnection(first: 1) {
          ... on QueryUserConnection {
            totalCount
          }
        }
        me {
          postCount
          publishedCount
          anotherPostCount: postCount
          postsConnection(first: 1) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
          postsConnectionFragment: postsConnection(first: 1) {
            ...postsTotalCountFragment
            edges {
              node {
                id
              }
            }
          }
          postsConnectionInlineFragment: postsConnection(first: 1) {
            ... on UserPostsConnection {
              inlineFragmentTotalCount: totalCount
            }
            edges {
              node {
                id
              }
            }
          }
          oldPosts: postsConnection(first: 1, oldestFirst: true) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
          publishedPosts: postsConnection(first: 1, published: true) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      }

      fragment totalCountFragment on QueryUserConnection {
        totalCount
      }

      fragment postsTotalCountFragment on UserPostsConnection {
        fragmentTotalCount: totalCount
      }
    `;

    const result = await execute({
      schema,
      document: query,
      contextValue: { user: { id: 1 } },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "me": {
            "anotherPostCount": 250,
            "oldPosts": {
              "edges": [
                {
                  "node": {
                    "id": "1",
                  },
                },
              ],
              "totalCount": 250,
            },
            "postCount": 250,
            "postsConnection": {
              "edges": [
                {
                  "node": {
                    "id": "250",
                  },
                },
              ],
              "totalCount": 250,
            },
            "postsConnectionFragment": {
              "edges": [
                {
                  "node": {
                    "id": "250",
                  },
                },
              ],
              "fragmentTotalCount": 250,
            },
            "postsConnectionInlineFragment": {
              "edges": [
                {
                  "node": {
                    "id": "250",
                  },
                },
              ],
              "inlineFragmentTotalCount": 250,
            },
            "publishedCount": 149,
            "publishedPosts": {
              "edges": [
                {
                  "node": {
                    "id": "250",
                  },
                },
              ],
              "totalCount": 149,
            },
          },
          "userConnection": {
            "totalCount": 100,
          },
          "withFragment": {
            "totalCount": 100,
          },
          "withInlineFragment": {
            "totalCount": 100,
          },
        },
      }
    `);

    expect(queries).toMatchInlineSnapshot(`
      [
        {
          "action": "findMany",
          "args": {
            "skip": 0,
            "take": 2,
          },
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
        {
          "action": "findMany",
          "args": {
            "skip": 0,
            "take": 2,
          },
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
        {
          "action": "findMany",
          "args": {
            "skip": 0,
            "take": 2,
          },
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
        {
          "action": "findUnique",
          "args": {
            "include": {
              "_count": {
                "select": {
                  "posts": true,
                },
              },
              "posts": {
                "include": {
                  "comments": {
                    "include": {
                      "author": true,
                    },
                    "take": 3,
                  },
                },
                "orderBy": {
                  "createdAt": "desc",
                },
                "skip": 0,
                "take": 2,
              },
            },
            "where": {
              "id": 1,
            },
          },
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
        {
          "action": "count",
          "args": undefined,
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
        {
          "action": "count",
          "args": undefined,
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
        {
          "action": "count",
          "args": undefined,
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
        {
          "action": "findUniqueOrThrow",
          "args": {
            "include": {
              "_count": {
                "select": {
                  "posts": {
                    "where": {
                      "published": true,
                    },
                  },
                },
              },
              "posts": {
                "include": {
                  "comments": {
                    "include": {
                      "author": true,
                    },
                    "take": 3,
                  },
                },
                "orderBy": {
                  "createdAt": "desc",
                },
                "skip": 0,
                "take": 2,
                "where": {
                  "published": true,
                },
              },
            },
            "where": {
              "id": 1,
            },
          },
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
        {
          "action": "findUniqueOrThrow",
          "args": {
            "include": {
              "_count": {
                "select": {
                  "posts": true,
                },
              },
              "posts": {
                "include": {
                  "comments": {
                    "include": {
                      "author": true,
                    },
                    "take": 3,
                  },
                },
                "orderBy": {
                  "createdAt": "asc",
                },
                "skip": 0,
                "take": 2,
              },
            },
            "where": {
              "id": 1,
            },
          },
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
      ]
    `);
  });

  it('nested in single item', async () => {
    const query = gql`
      query {
        post(id: 1) {
          id
          author {
            postCount
            profile {
              user {
                postCount
              }
            }
            postsConnection {
              totalCount
            }
          }
        }
        users {
          profile {
            user {
              profile {
                user {
                  profile {
                    user {
                      postCount
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await execute({
      schema,
      document: query,
      contextValue: { user: { id: 1 } },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "post": {
            "author": {
              "postCount": 250,
              "postsConnection": {
                "totalCount": 250,
              },
              "profile": {
                "user": {
                  "postCount": 250,
                },
              },
            },
            "id": "1",
          },
          "users": [
            {
              "profile": {
                "user": {
                  "profile": {
                    "user": {
                      "profile": {
                        "user": {
                          "postCount": 250,
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              "profile": null,
            },
          ],
        },
      }
    `);

    expect(queries).toMatchInlineSnapshot(`
      [
        {
          "action": "findUnique",
          "args": {
            "include": {
              "author": {
                "include": {
                  "_count": {
                    "select": {
                      "posts": true,
                    },
                  },
                  "posts": {
                    "orderBy": {
                      "createdAt": "desc",
                    },
                    "skip": 0,
                    "take": 21,
                  },
                  "profile": {
                    "include": {
                      "user": {
                        "include": {
                          "_count": {
                            "select": {
                              "posts": true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "comments": {
                "include": {
                  "author": true,
                },
                "take": 3,
              },
            },
            "where": {
              "id": 1,
            },
          },
          "dataPath": [],
          "model": "Post",
          "runInTransaction": false,
        },
        {
          "action": "findMany",
          "args": {
            "include": {
              "profile": {
                "include": {
                  "user": {
                    "include": {
                      "profile": {
                        "include": {
                          "user": {
                            "include": {
                              "profile": {
                                "include": {
                                  "user": {
                                    "include": {
                                      "_count": {
                                        "select": {
                                          "posts": true,
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "take": 2,
          },
          "dataPath": [],
          "model": "User",
          "runInTransaction": false,
        },
      ]
    `);
  });

  it('nested in list of item', async () => {
    const query = gql`
      query {
        posts {
          author {
            postCount
            postsConnection(first: 1) {
              totalCount
              edges {
                node {
                  author {
                    postCount
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await execute({
      schema,
      document: query,
      contextValue: { user: { id: 1 } },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "posts": [
            {
              "author": {
                "postCount": 250,
                "postsConnection": {
                  "edges": [
                    {
                      "node": {
                        "author": {
                          "postCount": 250,
                        },
                      },
                    },
                  ],
                  "totalCount": 250,
                },
              },
            },
            {
              "author": {
                "postCount": 250,
                "postsConnection": {
                  "edges": [
                    {
                      "node": {
                        "author": {
                          "postCount": 250,
                        },
                      },
                    },
                  ],
                  "totalCount": 250,
                },
              },
            },
            {
              "author": {
                "postCount": 250,
                "postsConnection": {
                  "edges": [
                    {
                      "node": {
                        "author": {
                          "postCount": 250,
                        },
                      },
                    },
                  ],
                  "totalCount": 250,
                },
              },
            },
          ],
        },
      }
    `);
    expect(queries).toMatchInlineSnapshot(`
      [
        {
          "action": "findMany",
          "args": {
            "include": {
              "author": {
                "include": {
                  "_count": {
                    "select": {
                      "posts": true,
                    },
                  },
                  "posts": {
                    "include": {
                      "author": {
                        "include": {
                          "_count": {
                            "select": {
                              "posts": true,
                            },
                          },
                        },
                      },
                      "comments": {
                        "include": {
                          "author": true,
                        },
                        "take": 3,
                      },
                    },
                    "orderBy": {
                      "createdAt": "desc",
                    },
                    "skip": 0,
                    "take": 2,
                  },
                },
              },
              "comments": {
                "include": {
                  "author": true,
                },
                "take": 3,
              },
            },
            "take": 3,
          },
          "dataPath": [],
          "model": "Post",
          "runInTransaction": false,
        },
      ]
    `);
  });
});
