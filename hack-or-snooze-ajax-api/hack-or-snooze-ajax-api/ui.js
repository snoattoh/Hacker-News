$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $favoriteStoriesList = $("#favorited-articles");
  const $myStoriesList = $("#my-articles");
  const $createStoryForm = $("#create-story-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navSubmit = $("#nav-submit");
  const $navFavorites = $("#nav-favorites");
  const $navMine = $("#nav-mine");
  const $navWelcome = $("#nav-welcome");
  const $navUserProfile = $("#nav-user-profile");
  const $userProfile = $("#user-profile"); //names are similar so it can be confusing...

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage(currentUser);
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage(currentUser);
    loginAndSubmitForm();
  });

    /**
   * Event listener for creating a story
   * If successful, returns created story (we'll append it the list of stories)
   */

  $createStoryForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let author = $("#create-story-author").val();
    let title = $("#create-story-title").val();
    let url = $("#create-story-url").val();

    // call the create method, which calls the API and then builds a new user instance
    const newStory = await StoryList.addStory(currentUser, {author, title, url});

    //Can't I just rerun generateStories? It'd be better just to add the one though?? bleh...
    //const result = generateStoryHTML(newStory);
    //$allStoriesList.append(result);
    //I guess this might be problematic if they create multiple stories? hm
    //This will append it to the end of the lisst so I'll just run generateStories ... or not
    //Actually need to update the user as well... to update 'my stories' generateStories is run here so ...
    checkIfLoggedIn();

  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.hide();
    $navFavorites.hide();
    $navSubmit.hide();
    $navMine.hide();

  });

  /**
   * Event Handler for Submit Story
   */

  $navSubmit.on("click", function() {
    // Show the Login and Create Account Forms
    $createStoryForm.slideToggle();
  });

  /**
   * Event Handler for Favorite Stories
   */

  $navFavorites.on("click", function() {
    $favoriteStoriesList.show();
    $myStoriesList.hide();
    $allStoriesList.hide();
  });

  $navMine.on("click", function() {
    // console.log($favoriteStoriesList);
    // console.log($allStoriesList);
    // Show the Login and Create Account Forms
    $myStoriesList.show();
    $favoriteStoriesList.hide();
    $allStoriesList.hide();
  });


  $allStoriesList.on("click", ".star", checkFavorite);
  $allStoriesList.on("click", ".trash", removeStory);
  $favoriteStoriesList.on("click", ".star", checkFavorite);
  $favoriteStoriesList.on("click", ".trash", removeStory);
  $myStoriesList.on("click", ".star", checkFavorite);
  $myStoriesList.on("click", ".trash", removeStory);


  /**
   * Event handler for favorites
   */
  async function checkFavorite(evt){
    const $tgt = $(evt.target);
    console.log($tgt.parent().parent());
    if($tgt.hasClass("fas")){
      console.log('unfavoriting');
      currentUser =  await currentUser.handleStory(currentUser, $tgt.closest("li").attr("id"), "DELETE");
      $tgt.closest("i").toggleClass("fas far");
      
    } else{
      console.log('favoriting');
      currentUser =  await currentUser.handleStory(currentUser, $tgt.closest("li").attr("id"), "POST");
      $tgt.closest("i").toggleClass("fas far");
    }
    console.log(currentUser);
    refreshUserStories();
  }

  /**
   * Event handler for story deletion
   */
  async function removeStory(evt){

    const $tgt = $(evt.target);
    console.log('deletingStory');
    await currentUser.removeStory(currentUser.loginToken, $tgt.closest("li").attr("id"));
    $tgt.parent().parent().remove(); 
    checkIfLoggedIn();
  }


  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    // hideElements();
    await generateStories();
    $allStoriesList.show();
    $favoriteStoriesList.hide();
    $myStoriesList.hide();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");


    generateStories();
    $allStoriesList.show();

    // update the navigation bar

    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    if(currentUser){
      refreshUserStories();
    }

    for (let story of storyList.stories) {
       const result = generateStoryHTML(story);
       $allStoriesList.append(result);
    }
  }

  /**
   * picked apart the generate stories function to grab how we populate favorites 
   * so we can refresh it freely when necessary
   */
  function refreshUserStories(){ 
    console.log(currentUser);
    $favoriteStoriesList.empty();
    $myStoriesList.empty();
    for (let story of currentUser.favorites) {
      const result = generateStoryHTML(story);
      $favoriteStoriesList.append(result);
     }
    for (let story of currentUser.ownStories) {
      const result = generateStoryHTML(story);
      $myStoriesList.append(result);
     }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
         ${Boolean(currentUser) ? checkStarHTML(story, currentUser) : ""} 
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        ${Boolean(currentUser) ? addTrashHTML() : ""} 
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  function checkStarHTML(story, user){
    // console.log(story);
    // console.log(user.favorites);
      const isFavorite = (user.favorites.find(s => s.storyId === story.storyId) != undefined);
      // console.log(isFavorite);
      const starType = isFavorite  ? "fas" : "far";
      // console.log(starType);
      return `
          <span class="star">
            <i class="${starType} fa-star"></i>
          </span>`;
  }

  function addTrashHTML(){
    //no criteria for removing information is dangerous
      return `
          <span class="trash">
            <i class="fas fa-trash"></i>
          </span>`;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $createStoryForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $navFavorites,
      $navSubmit,
      $navMine
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navWelcome.show();
    $navLogOut.show();
    $navFavorites.show();
    $navSubmit.show();
    $navMine.show();

    $navUserProfile.empty();
    $userProfile.empty();
    $navUserProfile.append(`${currentUser.name}`)
    $userProfile.append(`
    <h4>User Profile Info</h4>
    <section>
      <div id="profile-name">Name: ${currentUser.name}</div>
      <div id="profile-username">Username: ${currentUser.username}</div>
      <div id="profile-account-date">Account Created: ${currentUser.createdAt.toLocaleString()}</div>
    </section>
  </section>
    `) //I suppose alternatively I could have targetted each profile element...
  }

});
