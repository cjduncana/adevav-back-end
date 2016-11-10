'use strict';

require('../testHelpers');

const moment = require('moment');
const Promise = require('bluebird');

// Remove unhandled promise errors from bluebird
Promise.onPossiblyUnhandledRejection(() => {});

const PostFixture = require('../fixtures/post');

let Post;
let User;

exports.lab = Lab.script();

const server = Server.server;

describe('Post resources', () => {
  let validTokens = [];

  before((done) => {
    Server.initialize()
    .then(() => {
      Post = server.models.Post;
      User = server.models.User;

      return logIn();
    })

    .then((tokens) => {
      validTokens = tokens;
      return done();
    })

    .catch(done);
  });

  describe('GET /posts', () => {
    let postInstance;
    let privatePostInstance;
    let userInstance;

    const instances = [];

    const samplePost = {
      title: 'My First Post',
      slug: 'my-first-post',
      body: 'This is my first post.',
      status: 'Published'
    };
    const sampleUser = {
      email: 'user@example.com',
      role: 'Administrator',
      isAssociate: false
    };

    function callServer(token, test) {
      return server.inject({
        method: 'GET',
        url: '/posts',
        headers: {
          Authorization: token
        }
      }, test);
    }

    before((done) => {
      User.createUser(sampleUser)
      .then((user) => {
        userInstance = user;
        instances.push(user);

        const samplePostWithAuthor = Object.assign({}, samplePost, {
          authorId: user.id
        });
        const samplePrivatePost = Object.assign({}, samplePostWithAuthor, {
          visibility: 'Private',
          slug: 'my-first-post-private'
        });

        return Promise.props({
          publicPost: Post.createPost(samplePostWithAuthor),
          privatePost: Post.createPost(samplePrivatePost)
        });
      })

      .then(({ publicPost, privatePost }) => {
        postInstance = publicPost;
        privatePostInstance = privatePost;
        instances.push(publicPost, privatePost);
        return done();
      })
      .catch(done);
    });

    after((done) => {
      destroyAll(instances)
      .then(() => done())
      .catch(done);
    });

    describe('success', () => {

      it('should return a list of Posts when this endpoint is used correctly', (done) => {
        return callServer(validTokens['Administrator'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });

      it('should return a list that includes Private Posts if the User has written any Private Posts', (done) => {
        const token = createToken({ sub: userInstance.id });

        return callServer(token, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }, {
            id: privatePostInstance.id,
            title: 'My First Post',
            slug: 'my-first-post-private',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Private',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });

      describe('view posts by visibility', () => {
        // Posts by Visibility
        let administratorPostInstance;
        let editorPostInstance;
        let authorPostInstance;
        let contributorPostInstance;
        let subscriberPostInstance;

        // Users by Role
        let administratorUserInstance;
        let editorUserInstance;
        let authorUserInstance;
        let contributorUserInstance;
        let subscriberUserInstance;

        const instances = [];

        const sampleAdministrator = Object.assign({}, sampleUser, {
          email: 'administrator@example.com',
          role: 'Administrator'
        });
        const sampleEditor = Object.assign({}, sampleUser, {
          email: 'editor@example.com',
          role: 'Editor'
        });
        const sampleAuthor = Object.assign({}, sampleUser, {
          email: 'author@example.com',
          role: 'Author'
        });
        const sampleContributor = Object.assign({}, sampleUser, {
          email: 'contributor@example.com',
          role: 'Contributor'
        });
        const sampleSubscriber = Object.assign({}, sampleUser, {
          email: 'subscriber@example.com',
          role: 'Subscriber'
        });

        before((done) => {
          Promise.props({
            administrator: User.createUser(sampleAdministrator),
            editor: User.createUser(sampleEditor),
            author: User.createUser(sampleAuthor),
            contributor: User.createUser(sampleContributor),
            subscriber: User.createUser(sampleSubscriber)
          })
          .then(({ administrator, editor, author, contributor, subscriber }) => {
            administratorUserInstance = administrator;
            editorUserInstance = editor;
            authorUserInstance = author;
            contributorUserInstance = contributor;
            subscriberUserInstance = subscriber;
            instances.push(administrator, editor, author, contributor, subscriber);

            const sampleDraft = Object.assign({}, samplePost, {
              status: 'Draft',
              authorId: userInstance.id
            });
            const sampleAdministratorPost = Object.assign({}, sampleDraft, {
              slug: 'my-first-post-administrator',
              visibility: 'Administrator'
            });
            const sampleEditorPost = Object.assign({}, sampleDraft, {
              slug: 'my-first-post-editor',
              visibility: 'Editor'
            });
            const sampleAuthorPost = Object.assign({}, sampleDraft, {
              slug: 'my-first-post-author',
              visibility: 'Author'
            });
            const sampleContributorPost = Object.assign({}, sampleDraft, {
              slug: 'my-first-post-contributor',
              visibility: 'Contributor'
            });
            const sampleSubscriberPost = Object.assign({}, sampleDraft, {
              slug: 'my-first-post-subscriber',
              visibility: 'Subscriber'
            });

            return Promise.props({
              administrator: Post.createPost(sampleAdministratorPost),
              editor: Post.createPost(sampleEditorPost),
              author: Post.createPost(sampleAuthorPost),
              contributor: Post.createPost(sampleContributorPost),
              subscriber: Post.createPost(sampleSubscriberPost)
            });
          })
          .then(({ administrator, editor, author, contributor, subscriber }) => {
            administratorPostInstance = administrator;
            editorPostInstance = editor;
            authorPostInstance = author;
            contributorPostInstance = contributor;
            subscriberPostInstance = subscriber;
            instances.push(administrator, editor, author, contributor, subscriber);

            return done();
          })
          .catch(done);
        });

        after((done) => {
          destroyAll(instances)
          .then(() => done())
          .catch(done);
        });

        it('should return a list of Posts visible to Administrator, Editor, Author, Contributor, Subscriber, and Public if the User is an Administrator', (done) => {
          const token = createToken({ sub: administratorUserInstance.id });

          return callServer(token, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(200);
            expect(statusMessage).to.equal('OK');
            expect(result).to.equal([{
              id: postInstance.id,
              title: 'My First Post',
              slug: 'my-first-post',
              body: 'This is my first post.',
              status: 'Published',
              visibility: 'Public',
              publishedOn: moment().format(),
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: administratorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-administrator',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Administrator',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: authorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-author',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Author',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: contributorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-contributor',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Contributor',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: editorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-editor',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Editor',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: subscriberPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-subscriber',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Subscriber',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }]);

            return done();
          });
        });

        it('should return a list of Posts visible to Editor, Author, Contributor, Subscriber, and Public if the User is an Editor', (done) => {
          const token = createToken({ sub: editorUserInstance.id });

          return callServer(token, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(200);
            expect(statusMessage).to.equal('OK');
            expect(result).to.equal([{
              id: postInstance.id,
              title: 'My First Post',
              slug: 'my-first-post',
              body: 'This is my first post.',
              status: 'Published',
              visibility: 'Public',
              publishedOn: moment().format(),
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: authorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-author',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Author',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: contributorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-contributor',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Contributor',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: editorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-editor',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Editor',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: subscriberPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-subscriber',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Subscriber',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }]);

            return done();
          });
        });

        it('should return a list of Posts visible to Author, Contributor, Subscriber, and Public if the User is an Author', (done) => {
          const token = createToken({ sub: authorUserInstance.id });

          return callServer(token, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(200);
            expect(statusMessage).to.equal('OK');
            expect(result).to.equal([{
              id: postInstance.id,
              title: 'My First Post',
              slug: 'my-first-post',
              body: 'This is my first post.',
              status: 'Published',
              visibility: 'Public',
              publishedOn: moment().format(),
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: authorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-author',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Author',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: contributorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-contributor',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Contributor',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: subscriberPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-subscriber',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Subscriber',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }]);

            return done();
          });
        });

        it('should return a list of Posts visible to Contributor, Subscriber, and Public if the User is an Contributor', (done) => {
          const token = createToken({ sub: contributorUserInstance.id });

          return callServer(token, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(200);
            expect(statusMessage).to.equal('OK');
            expect(result).to.equal([{
              id: postInstance.id,
              title: 'My First Post',
              slug: 'my-first-post',
              body: 'This is my first post.',
              status: 'Published',
              visibility: 'Public',
              publishedOn: moment().format(),
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: contributorPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-contributor',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Contributor',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: subscriberPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-subscriber',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Subscriber',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }]);

            return done();
          });
        });

        it('should return a list of Posts visible to Subscriber and Public if the User is an Subscriber', (done) => {
          const token = createToken({ sub: subscriberUserInstance.id });

          return callServer(token, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(200);
            expect(statusMessage).to.equal('OK');
            expect(result).to.equal([{
              id: postInstance.id,
              title: 'My First Post',
              slug: 'my-first-post',
              body: 'This is my first post.',
              status: 'Published',
              visibility: 'Public',
              publishedOn: moment().format(),
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }, {
              id: subscriberPostInstance.id,
              title: 'My First Post',
              slug: 'my-first-post-subscriber',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Subscriber',
              publishedOn: '',
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }]);

            return done();
          });
        });

        it('should return a list of only Published Public Posts if the User has no role', (done) => {
          return callServer(null, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(200);
            expect(statusMessage).to.equal('OK');
            expect(result).to.equal([{
              id: postInstance.id,
              title: 'My First Post',
              slug: 'my-first-post',
              body: 'This is my first post.',
              status: 'Published',
              visibility: 'Public',
              publishedOn: moment().format(),
              author: {
                id: userInstance.id,
                email: 'user@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            }]);

            return done();
          });
        });
      });
    });

    describe('user authorization', () => {

      it('should return a 200 OK if the User is an Administrator', (done) => {
        return callServer(validTokens['Administrator'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });

      it('should return a 200 OK if the User is an Editor', (done) => {
        return callServer(validTokens['Editor'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });

      it('should return a 200 OK if the User is an Author', (done) => {
        return callServer(validTokens['Author'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });

      it('should return a 200 OK if the User is an Contributor', (done) => {
        return callServer(validTokens['Contributor'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });

      it('should return a 200 OK if the User is an Subscriber', (done) => {
        return callServer(validTokens['Subscriber'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });

      it('should return a 200 OK if the token is missing', (done) => {
        return callServer(null, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });

      it('should return a 200 OK if the token is invalid', (done) => {
        return callServer(invalidToken(), ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(200);
          expect(statusMessage).to.equal('OK');
          expect(result).to.equal([{
            id: postInstance.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: userInstance.id,
              email: 'user@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          }]);

          return done();
        });
      });
    });

    it('should return a 500 Internal Server Error if an unhandled error occurs', (done) => {
      sinon.stub(Post, 'listPosts').returns(Promise.reject('Error in GET /posts'));

      return callServer(validTokens['Administrator'], ({ result, statusCode, statusMessage }) => {
        expect(statusCode).to.equal(500);
        expect(statusMessage).to.equal('Internal Server Error');
        expect(result).to.equal({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred'
        });

        Post.listPosts.restore();
        return done();
      });
    });
  });

  describe('POST /posts', () => {
    let administratorInstance;
    let contributorInstance;

    const instances = [];

    const sampleAdministrator = {
      email: 'administrator@example.com',
      role: 'Administrator',
      isAssociate: false
    };
    const sampleContributor = {
      email: 'contributor@example.com',
      role: 'Contributor',
      isAssociate: false
    };

    const validPayload = Object.assign({}, PostFixture, {
      status: 'Draft'
    });

    function callServer(payload, token, test) {
      return server.inject({
        method: 'POST',
        url: '/posts',
        payload,
        headers: {
          Authorization: token
        }
      }, test);
    }

    before((done) => {
      Promise.props({
        administrator: User.createUser(sampleAdministrator),
        contributor: User.createUser(sampleContributor)
      })
      .then(({ administrator, contributor }) => {
        administratorInstance = administrator;
        contributorInstance = contributor;
        instances.push(administrator, contributor);

        return done();
      })
      .catch(done);
    });

    after((done) => {
      destroyAll(instances)
      .then(() => done())
      .catch(done);
    });

    describe('success', () => {

      it('should return a newly created Post when this endpoint is used correctly', (done) => {
        const token = createToken({ sub: administratorInstance.id });

        return callServer(validPayload, token, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(201);
          expect(statusMessage).to.equal('Created');
          expect(result).to.equal({
            id: result.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Draft',
            visibility: 'Public',
            publishedOn: '',
            author: {
              id: administratorInstance.id,
              email: 'administrator@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          });

          return Post.getPost(result.id)
          .then((post) => destroyAll([post]))
          .then(() => done())
          .catch(done);
        });
      });

      it('should allow a User to publish a Post if they are not a Contributor', (done) => {
        const token = createToken({ sub: administratorInstance.id });

        const payload = Object.assign({}, validPayload, {
          status: 'Published'
        });

        return callServer(payload, token, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(201);
          expect(statusMessage).to.equal('Created');
          expect(result).to.equal({
            id: result.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Published',
            visibility: 'Public',
            publishedOn: moment().format(),
            author: {
              id: administratorInstance.id,
              email: 'administrator@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          });

          return Post.getPost(result.id)
          .then((post) => destroyAll([post]))
          .then(() => done())
          .catch(done);
        });
      });

      describe('post slugs', () => {
        const instances = [];

        before((done) => {
          const samplePost = Object.assign({}, PostFixture, {
            authorId: contributorInstance.id,
            status: 'Draft'
          });

          Post.createPost(samplePost)
          .then((post) => {
            instances.push(post);

            return done();
          })
          .catch(done);
        });

        after((done) => {
          destroyAll(instances)
          .then(() => done())
          .catch(done);
        });

        it('should generate a slug from the Post\'s title if no slug is provided', (done) => {
          const token = createToken({ sub: administratorInstance.id });
          const payload = Object.assign({}, validPayload, {
            title: 'My Post',
            body: 'This is a post.'
          });
          delete payload.slug;

          return callServer(payload, token, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(201);
            expect(statusMessage).to.equal('Created');
            expect(result).to.equal({
              id: result.id,
              title: 'My Post',
              slug: 'my-post',
              body: 'This is a post.',
              status: 'Draft',
              visibility: 'Public',
              publishedOn: '',
              author: {
                id: administratorInstance.id,
                email: 'administrator@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            });

            return Post.getPost(result.id)
            .then((post) => destroyAll([post]))
            .then(() => done())
            .catch(done);
          });
        });

        it('should generate a different slug from the one generated if another Post with the same slug exists', (done) => {
          const token = createToken({ sub: administratorInstance.id });
          const payload = Object.assign({}, validPayload);
          delete payload.slug;

          return callServer(validPayload, token, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(201);
            expect(statusMessage).to.equal('Created');
            expect(result).to.equal({
              id: result.id,
              title: 'My First Post',
              slug: 'my-first-post-1',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Public',
              publishedOn: '',
              author: {
                id: administratorInstance.id,
                email: 'administrator@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            });

            return Post.getPost(result.id)
            .then((post) => destroyAll([post]))
            .then(() => done())
            .catch(done);
          });
        });

        it('should generate a different slug from the one provided if another Post with the same slug exists', (done) => {
          const token = createToken({ sub: administratorInstance.id });

          return callServer(validPayload, token, ({ result, statusCode, statusMessage }) => {
            expect(statusCode).to.equal(201);
            expect(statusMessage).to.equal('Created');
            expect(result).to.equal({
              id: result.id,
              title: 'My First Post',
              slug: 'my-first-post-1',
              body: 'This is my first post.',
              status: 'Draft',
              visibility: 'Public',
              publishedOn: '',
              author: {
                id: administratorInstance.id,
                email: 'administrator@example.com',
                firstName: '',
                lastName: '',
                avatar: '',
                role: 'Administrator',
                isAssociate: false
              }
            });

            return Post.getPost(result.id)
            .then((post) => destroyAll([post]))
            .then(() => done())
            .catch(done);
          });
        });
      });
    });

    describe('bad request', () => {

      it('should return a 400 Bad Request if the payload is missing', (done) => {
        return callServer(null, validTokens['Administrator'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(400);
          expect(statusMessage).to.equal('Bad Request');
          expect(result).to.equal({
            statusCode: 400,
            error: 'Bad Request',
            message: '"Post" must be an object',
            validation: {
              source: 'payload',
              keys: ['Post']
            }
          });
          return done();
        });
      });

      it('should return a 400 Bad Request if the title is missing from the payload', (done) => {
        const invalidPayload = Object.assign({}, validPayload);
        delete invalidPayload.title;

        return callServer(invalidPayload, validTokens['Administrator'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(400);
          expect(statusMessage).to.equal('Bad Request');
          expect(result).to.equal({
            statusCode: 400,
            error: 'Bad Request',
            message: 'child "Title" fails because ["Title" is required]',
            validation: {
              source: 'payload',
              keys: ['title']
            }
          });
          return done();
        });
      });

      it('should return a 400 Bad Request if the body is missing from the payload', (done) => {
        const invalidPayload = Object.assign({}, validPayload);
        delete invalidPayload.body;

        return callServer(invalidPayload, validTokens['Administrator'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(400);
          expect(statusMessage).to.equal('Bad Request');
          expect(result).to.equal({
            statusCode: 400,
            error: 'Bad Request',
            message: 'child "Body" fails because ["Body" is required]',
            validation: {
              source: 'payload',
              keys: ['body']
            }
          });
          return done();
        });
      });

      it('should return a 400 Bad Request if a Contributor wants to publish a post', (done) => {
        const token = createToken({ sub: contributorInstance.id });
        const invalidPayload = Object.assign({}, validPayload, {
          status: 'Published'
        });

        return callServer(invalidPayload, token, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(400);
          expect(statusMessage).to.equal('Bad Request');
          expect(result).to.equal({
            statusCode: 400,
            error: 'Bad Request',
            message: 'You are not allowed to publish posts'
          });
          return done();
        });
      });
    });

    describe('user authorization', () => {
      let editorInstance;
      let authorInstance;

      const instances = [];

      const sampleEditor = {
        email: 'editor@example.com',
        role: 'Editor',
        isAssociate: false
      };
      const sampleAuthor = {
        email: 'author@example.com',
        role: 'Author',
        isAssociate: false
      };

      before((done) => {
        Promise.props({
          editor: User.createUser(sampleEditor),
          author: User.createUser(sampleAuthor)
        })
        .then(({ editor, author }) => {
          editorInstance = editor;
          authorInstance = author;
          instances.push(editor, author);

          return done();
        })
        .catch(done);
      });

      after((done) => {
        destroyAll(instances)
        .then(() => done())
        .catch(done);
      });

      it('should return a 201 Created if the User is an Administrator', (done) => {
        const token = createToken({ sub: administratorInstance.id });

        return callServer(validPayload, token, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(201);
          expect(statusMessage).to.equal('Created');
          expect(result).to.equal({
            id: result.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Draft',
            visibility: 'Public',
            publishedOn: '',
            author: {
              id: administratorInstance.id,
              email: 'administrator@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Administrator',
              isAssociate: false
            }
          });

          return Post.getPost(result.id)
          .then((post) => destroyAll([post]))
          .then(() => done())
          .catch(done);
        });
      });

      it('should return a 201 Created if the User is a Editor', (done) => {
        const token = createToken({ sub: editorInstance.id });

        return callServer(validPayload, token, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(201);
          expect(statusMessage).to.equal('Created');
          expect(result).to.equal({
            id: result.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Draft',
            visibility: 'Public',
            publishedOn: '',
            author: {
              id: editorInstance.id,
              email: 'editor@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Editor',
              isAssociate: false
            }
          });

          return Post.getPost(result.id)
          .then((post) => destroyAll([post]))
          .then(() => done())
          .catch(done);
        });
      });

      it('should return a 201 Created if the User is a Author', (done) => {
        const token = createToken({ sub: authorInstance.id });

        return callServer(validPayload, token, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(201);
          expect(statusMessage).to.equal('Created');
          expect(result).to.equal({
            id: result.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Draft',
            visibility: 'Public',
            publishedOn: '',
            author: {
              id: authorInstance.id,
              email: 'author@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Author',
              isAssociate: false
            }
          });

          return Post.getPost(result.id)
          .then((post) => destroyAll([post]))
          .then(() => done())
          .catch(done);
        });
      });

      it('should return a 201 Created if the User is a Contributor', (done) => {
        const token = createToken({ sub: contributorInstance.id });

        return callServer(validPayload, token, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(201);
          expect(statusMessage).to.equal('Created');
          expect(result).to.equal({
            id: result.id,
            title: 'My First Post',
            slug: 'my-first-post',
            body: 'This is my first post.',
            status: 'Draft',
            visibility: 'Public',
            publishedOn: '',
            author: {
              id: contributorInstance.id,
              email: 'contributor@example.com',
              firstName: '',
              lastName: '',
              avatar: '',
              role: 'Contributor',
              isAssociate: false
            }
          });

          return Post.getPost(result.id)
          .then((post) => destroyAll([post]))
          .then(() => done())
          .catch(done);
        });
      });

      it('should return a 401 Unauthorized if the token is missing', (done) => {
        return callServer(validPayload, null, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(401);
          expect(statusMessage).to.equal('Unauthorized');
          expect(result).to.equal({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Missing authentication'
          });
          return done();
        });
      });

      it('should return a 401 Unauthorized if the token is invalid', (done) => {
        return callServer(validPayload, invalidToken(), ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(401);
          expect(statusMessage).to.equal('Unauthorized');
          expect(result).to.equal({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid credentials',
            attributes: {
              error: 'Invalid credentials'
            }
          });
          return done();
        });
      });

      it('should return a 403 Forbidden if the User is a Subscriber', (done) => {
        return callServer(validPayload, validTokens['Subscriber'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(403);
          expect(statusMessage).to.equal('Forbidden');
          expect(result).to.equal({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You are not allowed to use this resource.'
          });
          return done();
        });
      });

      it('should return a 403 Forbidden if the User is not in the system', (done) => {
        return callServer(validPayload, validTokens['Administrator'], ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(403);
          expect(statusMessage).to.equal('Forbidden');
          expect(result).to.equal({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You are not allowed to use this resource.'
          });
          return done();
        });
      });
    });

    it('should return a 500 Internal Server Error if an unhandled error occurs', (done) => {
      sinon.stub(Post, 'createPost').returns(Promise.reject('Error in POST /posts'));

      const token = createToken({ sub: administratorInstance.id });

      return callServer(validPayload, token, ({ result, statusCode, statusMessage }) => {
        expect(statusCode).to.equal(500);
        expect(statusMessage).to.equal('Internal Server Error');
        expect(result).to.equal({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred'
        });

        Post.createPost.restore();
        return done();
      });
    });
  });
});
