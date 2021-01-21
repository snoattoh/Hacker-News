
/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;
    console.log(response.data);

    return existingUser;
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);
    console.log(response.data.user);
    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }

  /** Updates a users favorite or unfavorite story.
   *
   * This function accepts the user and story and then updates the users favorited stories
   * 
   */

  // async favoriteStory(user, storyId) {
  //   const response = await axios.post(`${BASE_URL}/users/${user.username}/favorites/${storyId}`, {
  //     token: user.loginToken
  //   });
  //   console.log(response);
  //   return new User(response.data.user)
  // }

  async handleStory(user, storyId, method){
    if(method == "POST"){
      const response = await axios.post(`${BASE_URL}/users/${user.username}/favorites/${storyId}`, {
        token: user.loginToken
      });
      console.log(response.data.user);
      user.favorites = response.data.user.favorites.map(s => new Story(s));
      user.ownStories = response.data.user.stories.map(s => new Story(s));
      console.log(user);
      return user
    }else{
      const response = await axios({
        url: `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
        method: "DELETE",
        data: {token: user.loginToken},
      });
      console.log(response.data.user);
      user.favorites = response.data.user.favorites.map(s => new Story(s));
      user.ownStories = response.data.user.stories.map(s => new Story(s));
      console.log(user);
      return user
    }
  }

  // async unfavoriteStory(user, storyId) {
    
  // }
  //for some resaon axios.delete doesn't work, I should have reviewed the docuementation for it before switching

    /** Deletes a story based on a ussers selection
   *
   * This function accepts the storyId and deletes it from the backend assuming the id is correct, returning
   * the deleted sotry as a JSON object
   */
  //I'm assuming this is a user class action since only users should be able to do this.
  //was losing my mind, of course we can't delete the initial test data, it'd be a mean prank to pull...

  async removeStory(token, storyId) {
    console.log(token);
    console.log(storyId);
    const response = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: {token: token},
    });
    console.log(response.data.message);
    return new User(response.data.message);
  }
} 

